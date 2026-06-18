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

  mergeWords: (groupId: string, words: string[]) => void
  unmergeWord: (groupId: string, word: string) => void
  moveWordToGroup: (fromGroupId: string, toGroupId: string, word: string) => void
  changeGroupCategory: (groupId: string, category: Category) => void

  addTimelineNote: (eventId: string, noteType: EventNote['noteType'], content: string) => void
  removeTimelineNote: (eventId: string, noteId: string) => void

  addWatchItem: (word: string, priority: WatchItem['priority'], reason: string) => void
  removeWatchItem: (id: string) => void
  updateWatchItem: (id: string, updates: Partial<Omit<WatchItem, 'id'>>) => void

  getRecordsByCategory: (category: Category) => SensitiveRecord[]
  getRecordsByChannel: (channel: Channel) => SensitiveRecord[]
  getTopWords: (limit: number) => { word: string; count: number }[]
  getChannelDistribution: () => { channel: Channel; count: number }[]
  getCategoryDistribution: () => { category: Category; count: number }[]
}

interface EventNote {
  id: string
  eventId: string
  noteType: 'official_response' | 'media_report' | 'influencer_repost' | 'other'
  content: string
  createdAt: string
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

  addRecords: (records) => set((s) => ({ records: [...s.records, ...records] })),
  setRecords: (records) => set({ records, dataLoaded: true }),

  mergeWords: (groupId, words) =>
    set((s) => ({
      wordGroups: s.wordGroups.map((g) =>
        g.id === groupId
          ? { ...g, mergedWords: [...new Set([...g.mergedWords, ...words])], totalCount: g.totalCount }
          : g
      ),
    })),

  unmergeWord: (groupId, word) =>
    set((s) => ({
      wordGroups: s.wordGroups.map((g) =>
        g.id === groupId && g.mainWord !== word
          ? { ...g, mergedWords: g.mergedWords.filter((w) => w !== word), totalCount: g.totalCount }
          : g
      ),
    })),

  moveWordToGroup: (fromGroupId, toGroupId, word) =>
    set((s) => {
      const fromGroup = s.wordGroups.find((g) => g.id === fromGroupId)
      if (!fromGroup || fromGroup.mainWord === word) return s
      return {
        wordGroups: s.wordGroups.map((g) => {
          if (g.id === fromGroupId) {
            return { ...g, mergedWords: g.mergedWords.filter((w) => w !== word) }
          }
          if (g.id === toGroupId) {
            return { ...g, mergedWords: [...new Set([...g.mergedWords, word])] }
          }
          return g
        }),
      }
    }),

  changeGroupCategory: (groupId, category) =>
    set((s) => ({
      wordGroups: s.wordGroups.map((g) =>
        g.id === groupId ? { ...g, category } : g
      ),
    })),

  addTimelineNote: (eventId, noteType, content) =>
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
                  createdAt: new Date().toISOString(),
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
}))
