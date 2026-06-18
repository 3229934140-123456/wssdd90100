import { create } from 'zustand'
import type { SensitiveRecord, WordGroup, TimelineEvent, WatchItem, Category, Channel } from '@/types'
import { MOCK_RECORDS, MOCK_WORD_GROUPS, MOCK_TIMELINE_EVENTS, MOCK_WATCH_ITEMS } from '@/data/mockData'

interface AppState {
  records: SensitiveRecord[]
  wordGroups: WordGroup[]
  timelineEvents: TimelineEvent[]
  watchItems: WatchItem[]
  dataLoaded: boolean

  loadMockData: () => void
  addRecords: (records: SensitiveRecord[]) => void
  setRecords: (records: SensitiveRecord[]) => void

  mergeWords: (fromGroupId: string, toGroupId: string) => void
  unmergeWord: (groupId: string, word: string) => void
  removeGroup: (groupId: string) => void
  changeGroupCategory: (groupId: string, category: Category) => void

  addTimelineNote: (eventId: string, noteType: EventNote['noteType'], content: string, noteTimestamp?: string) => void
  removeTimelineNote: (eventId: string, noteId: string) => void
  generateTimelineFromRecords: () => void

  addWatchItem: (word: string, priority: WatchItem['priority'], reason: string) => void
  removeWatchItem: (id: string) => void
  updateWatchItem: (id: string, updates: Partial<Omit<WatchItem, 'id'>>) => void

  getRecordsByCategory: (category: Category) => SensitiveRecord[]
  getRecordsByChannel: (channel: Channel) => SensitiveRecord[]
  getTopWords: (limit: number) => { word: string; count: number }[]
  getChannelDistribution: () => { channel: Channel; count: number }[]
  getCategoryDistribution: () => { category: Category; count: number }[]
  getDisposalTimes: () => { avg: number; max: number; min: number; pairs: { spike: string; response: string; hours: number; type: string }[] }
}

interface EventNote {
  id: string
  eventId: string
  noteType: 'official_response' | 'media_report' | 'influencer_repost' | 'other'
  content: string
  createdAt: string
}

function generateGroupsFromRecords(records: SensitiveRecord[]): WordGroup[] {
  const wordMap = new Map<string, { word: string; category: Category; count: number }>()
  records.forEach((r) => {
    const existing = wordMap.get(r.word)
    if (existing) {
      existing.count += r.count
    } else {
      wordMap.set(r.word, { word: r.word, category: r.category, count: r.count })
    }
  })
  return Array.from(wordMap.entries()).map(([word, data], i) => ({
    id: `wg-auto-${i}`,
    mainWord: data.word,
    category: data.category,
    mergedWords: [data.word],
    totalCount: data.count,
  }))
}

function generateTimelineFromRecords(records: SensitiveRecord[]): TimelineEvent[] {
  if (records.length === 0) return []

  const recordsSorted = [...records].sort((a, b) => new Date(a.hitTime).getTime() - new Date(b.hitTime).getTime())

  const dayGroups = new Map<string, SensitiveRecord[]>()
  recordsSorted.forEach((r) => {
    const day = r.hitTime.slice(0, 10)
    if (!dayGroups.has(day)) dayGroups.set(day, [])
    dayGroups.get(day)!.push(r)
  })

  const days = Array.from(dayGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  const events: TimelineEvent[] = []
  const dayTotals = days.map(([day, recs]) => ({
    day,
    total: recs.reduce((sum, r) => sum + r.count, 0),
    topWord: recs.sort((a, b) => b.count - a.count)[0]?.word || '',
  }))

  if (dayTotals.length === 0) return []

  const maxTotal = Math.max(...dayTotals.map((d) => d.total))

  dayTotals.forEach(({ day, total, topWord }, i) => {
    const magnitude = Math.round((total / maxTotal) * 100)
    if (magnitude >= 30 || i === 0 || i === dayTotals.length - 1) {
      events.push({
        id: `te-auto-${i}`,
        timestamp: `${day}T09:00:00`,
        type: 'spike',
        description: `「${topWord}」等敏感词出现激增`,
        spikeMagnitude: magnitude,
        notes: [],
      })
    }
  })

  return events
}

function parseSafeInt(val: string, fallback: number): number {
  if (!val || val.trim() === '') return fallback
  const parsed = parseInt(val, 10)
  return isNaN(parsed) ? fallback : parsed
}

export const useStore = create<AppState>((set, get) => ({
  records: [],
  wordGroups: [],
  timelineEvents: [],
  watchItems: [],
  dataLoaded: false,

  loadMockData: () => {
    set({
      records: MOCK_RECORDS,
      wordGroups: MOCK_WORD_GROUPS,
      timelineEvents: MOCK_TIMELINE_EVENTS,
      watchItems: MOCK_WATCH_ITEMS,
      dataLoaded: true,
    })
  },

  addRecords: (records) => {
    set((s) => {
      const allRecords = [...s.records, ...records]
      return {
        records: allRecords,
        wordGroups: generateGroupsFromRecords(allRecords),
        timelineEvents: generateTimelineFromRecords(allRecords),
        watchItems: [],
        dataLoaded: true,
      }
    })
  },

  setRecords: (records) => {
    set({
      records,
      wordGroups: generateGroupsFromRecords(records),
      timelineEvents: generateTimelineFromRecords(records),
      watchItems: [],
      dataLoaded: true,
    })
  },

  mergeWords: (fromGroupId, toGroupId) =>
    set((s) => {
      const fromGroup = s.wordGroups.find((g) => g.id === fromGroupId)
      const toGroup = s.wordGroups.find((g) => g.id === toGroupId)
      if (!fromGroup || !toGroup || fromGroupId === toGroupId) return s

      const mergedWords = [...new Set([...toGroup.mergedWords, ...fromGroup.mergedWords])]
      const totalCount = toGroup.totalCount + fromGroup.totalCount

      return {
        wordGroups: s.wordGroups
          .filter((g) => g.id !== fromGroupId)
          .map((g) =>
            g.id === toGroupId
              ? { ...g, mergedWords, totalCount }
              : g
          ),
      }
    }),

  unmergeWord: (groupId, word) =>
    set((s) => {
      const group = s.wordGroups.find((g) => g.id === groupId)
      if (!group || group.mainWord === word) return s

      const remainingWords = group.mergedWords.filter((w) => w !== word)
      if (remainingWords.length === 0) return s

      const removedCount = get().records
        .filter((r) => r.word === word && r.category === group.category)
        .reduce((sum, r) => sum + r.count, 0)

      const newGroups = s.wordGroups.map((g) => {
        if (g.id !== groupId) return g
        return {
          ...g,
          mergedWords: remainingWords,
          totalCount: Math.max(0, g.totalCount - removedCount),
        }
      })

      const newGroup: WordGroup = {
        id: `wg-${Date.now()}`,
        mainWord: word,
        category: group.category,
        mergedWords: [word],
        totalCount: removedCount,
      }

      return { wordGroups: [...newGroups, newGroup] }
    }),

  removeGroup: (groupId) =>
    set((s) => ({
      wordGroups: s.wordGroups.filter((g) => g.id !== groupId),
    })),

  changeGroupCategory: (groupId, category) =>
    set((s) => ({
      wordGroups: s.wordGroups.map((g) =>
        g.id === groupId ? { ...g, category } : g
      ),
    })),

  addTimelineNote: (eventId, noteType, content, noteTimestamp) =>
    set((s) => ({
      timelineEvents: s.timelineEvents.map((e) =>
        e.id === eventId
          ? {
              ...e,
              notes: [
                ...e.notes,
                {
                  id: `n${Date.now()}`,
                  eventId,
                  noteType,
                  content,
                  createdAt: noteTimestamp || new Date().toISOString(),
                },
              ],
            }
          : e
      ),
    })),

  removeTimelineNote: (eventId, noteId) =>
    set((s) => ({
      timelineEvents: s.timelineEvents.map((e) =>
        e.id === eventId
          ? { ...e, notes: e.notes.filter((n) => n.id !== noteId) }
          : e
      ),
    })),

  generateTimelineFromRecords: () => {
    set((s) => ({
      timelineEvents: generateTimelineFromRecords(s.records),
    }))
  },

  addWatchItem: (word, priority, reason) =>
    set((s) => ({
      watchItems: [
        ...s.watchItems,
        { id: `w${Date.now()}`, word, priority, reason },
      ],
    })),

  removeWatchItem: (id) =>
    set((s) => ({
      watchItems: s.watchItems.filter((w) => w.id !== id),
    })),

  updateWatchItem: (id, updates) =>
    set((s) => ({
      watchItems: s.watchItems.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  getRecordsByCategory: (category) => get().records.filter((r) => r.category === category),
  getRecordsByChannel: (channel) => get().records.filter((r) => r.channel === channel),

  getTopWords: (limit) => {
    const wordMap = new Map<string, number>()
    get().records.forEach((r) => {
      wordMap.set(r.word, (wordMap.get(r.word) || 0) + r.count)
    })
    return Array.from(wordMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  },

  getChannelDistribution: () => {
    const channelMap = new Map<Channel, number>()
    get().records.forEach((r) => {
      channelMap.set(r.channel, (channelMap.get(r.channel) || 0) + r.count)
    })
    return Array.from(channelMap.entries()).map(([channel, count]) => ({ channel, count }))
  },

  getCategoryDistribution: () => {
    const catMap = new Map<Category, number>()
    get().records.forEach((r) => {
      catMap.set(r.category, (catMap.get(r.category) || 0) + r.count)
    })
    return Array.from(catMap.entries()).map(([category, count]) => ({ category, count }))
  },

  getDisposalTimes: () => {
    const events = get().timelineEvents
    const spikes = events
      .filter((e) => e.type === 'spike')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    const responseTypes: EventNote['noteType'][] = ['official_response', 'media_report', 'influencer_repost']

    const allResponses: { note: EventNote; time: number }[] = []
    events.forEach((e) => {
      e.notes.forEach((n) => {
        if (responseTypes.includes(n.noteType)) {
          allResponses.push({ note: n, time: new Date(n.createdAt).getTime() })
        }
      })
    })
    allResponses.sort((a, b) => a.time - b.time)

    const pairs: { spike: string; response: string; hours: number; type: string }[] = []
    const usedNoteIds = new Set<string>()

    spikes.forEach((spike, i) => {
      const spikeTime = new Date(spike.timestamp).getTime()
      const nextSpikeTime = i + 1 < spikes.length ? new Date(spikes[i + 1].timestamp).getTime() : Infinity

      let best: { note: EventNote; time: number; diff: number } | null = null

      for (const r of allResponses) {
        if (usedNoteIds.has(r.note.id)) continue
        if (r.time <= spikeTime) continue
        if (r.time >= nextSpikeTime) continue

        const diff = r.time - spikeTime
        if (!best || diff < best.diff) {
          best = { note: r.note, time: r.time, diff }
        }
      }

      if (best) {
        usedNoteIds.add(best.note.id)
        pairs.push({
          spike: spike.description,
          response: best.note.content,
          hours: best.diff / (1000 * 60 * 60),
          type: best.note.noteType,
        })
      }
    })

    if (pairs.length === 0) {
      return { avg: 0, max: 0, min: 0, pairs: [] }
    }

    const hours = pairs.map((p) => p.hours)
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length
    const max = Math.max(...hours)
    const min = Math.min(...hours)

    return { avg, max, min, pairs }
  },
}))

export { parseSafeInt }
