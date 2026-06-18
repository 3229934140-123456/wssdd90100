import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS, NOTE_TYPE_LABELS, type Category, type NoteType } from '@/types'
import { Calendar, MessageSquare, Newspaper, Megaphone, Plus, X, Filter } from 'lucide-react'

const EVENT_COLORS: Record<string, string> = {
  spike: '#F97316',
  official_response: '#22C55E',
  media_report: '#3B82F6',
  influencer_repost: '#8B5CF6',
}

const NOTE_ICONS: Record<string, React.ReactNode> = {
  official_response: <Megaphone size={14} />,
  media_report: <Newspaper size={14} />,
  influencer_repost: <MessageSquare size={14} />,
  other: <Calendar size={14} />,
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

const CAT_ACTIVE_CLASS: Record<Category, string> = {
  abuse: 'bg-cat-abuse text-white',
  boycott: 'bg-cat-boycott text-white',
  quality: 'bg-cat-quality text-zinc-900',
  fake_ad: 'bg-cat-fake_ad text-white',
  price: 'bg-cat-price text-white',
  other: 'bg-zinc-500 text-white',
}

export default function Timeline() {
  const timelineEvents = useStore((s) => s.timelineEvents)
  const addTimelineNote = useStore((s) => s.addTimelineNote)
  const removeTimelineNote = useStore((s) => s.removeTimelineNote)
  const records = useStore((s) => s.records)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [newNoteType, setNewNoteType] = useState<NoteType>('official_response')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteTimestamp, setNewNoteTimestamp] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = timelineEvents.filter((e) => {
    if (selectedCategories.length > 0) {
      const eventCategories = records
        .filter((r) => e.description.includes(r.word))
        .map((r) => r.category)
      if (!eventCategories.some((c) => selectedCategories.includes(c))) return false
    }
    if (dateFrom && e.timestamp < dateFrom) return false
    if (dateTo && e.timestamp > dateTo + 'T23:59:59') return false
    return true
  })

  const selectedEvent = timelineEvents.find((e) => e.id === selectedEventId)

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleAddNote = () => {
    if (!selectedEventId || !newNoteContent.trim()) return
    addTimelineNote(selectedEventId, newNoteType, newNoteContent.trim(), newNoteTimestamp || undefined)
    setNewNoteContent('')
    setNewNoteTimestamp('')
  }

  const sortedEvents = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xl font-display font-bold">事件时间线</h1>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-50 text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <Filter size={16} />
          <span className="text-sm">筛选</span>
        </button>
      </div>

      {filterOpen && (
        <div className="px-6 py-4 border-b border-zinc-800 card rounded-none flex flex-col gap-4">
          <div>
            <p className="text-sm text-zinc-400 mb-2">分类</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedCategories.includes(cat)
                      ? CAT_ACTIVE_CLASS[cat]
                      : 'bg-surface-50 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">起始</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-surface-50 text-zinc-200 text-sm rounded-lg px-3 py-1.5 border border-zinc-700 focus:border-accent outline-none font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">结束</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-surface-50 text-zinc-200 text-sm rounded-lg px-3 py-1.5 border border-zinc-700 focus:border-accent outline-none font-mono"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-6">
          {sortedEvents.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500">
              暂无事件数据
            </div>
          ) : (
            <div className="h-full flex items-end gap-4 min-w-max pb-2">
              {sortedEvents.map((event) => {
                const height = Math.max(event.spikeMagnitude * 1.8, 16)
                const color = EVENT_COLORS[event.type] || '#6B7280'
                const isSelected = event.id === selectedEventId
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`flex flex-col items-center gap-2 group transition-all ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-12 rounded-t-md transition-all ${
                          isSelected ? 'ring-2 ring-white/30' : ''
                        }`}
                        style={{ height: `${height}px`, backgroundColor: color }}
                      />
                      {event.spikeMagnitude >= 70 && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedEvent && (
          <div className="w-80 border-l border-zinc-800 bg-surface-100 flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-display font-bold text-zinc-100 truncate">
                事件详情
              </h2>
              <button
                onClick={() => setSelectedEventId(null)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[selectedEvent.type] }}
                  />
                  <span className="text-sm text-zinc-300">
                    {selectedEvent.type === 'spike' ? '热度飙升' : NOTE_TYPE_LABELS[selectedEvent.type as NoteType] || selectedEvent.type}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 font-mono">
                  {new Date(selectedEvent.timestamp).toLocaleString('zh-CN')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">强度</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${selectedEvent.spikeMagnitude}%`,
                        backgroundColor: EVENT_COLORS[selectedEvent.type],
                      }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {selectedEvent.spikeMagnitude}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <h3 className="text-xs font-display font-bold text-zinc-400 mb-2">备注</h3>
                {selectedEvent.notes.length === 0 ? (
                  <p className="text-xs text-zinc-600">暂无备注</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEvent.notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-surface-50 rounded-lg p-2.5 group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            {NOTE_ICONS[note.noteType]}
                            <span className="text-xs">{NOTE_TYPE_LABELS[note.noteType]}</span>
                          </div>
                          <button
                            onClick={() => removeTimelineNote(selectedEvent.id, note.id)}
                            className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-300">{note.content}</p>
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">
                          {new Date(note.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={newNoteType}
                  onChange={(e) => setNewNoteType(e.target.value as NoteType)}
                  className="bg-surface-50 text-zinc-300 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:border-accent outline-none"
                >
                  {Object.entries(NOTE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="输入备注内容..."
                  className="flex-1 bg-surface-50 text-zinc-200 text-xs rounded-lg px-3 py-1.5 border border-zinc-700 focus:border-accent outline-none placeholder:text-zinc-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 shrink-0">发生时间</span>
                <input
                  type="datetime-local"
                  value={newNoteTimestamp}
                  onChange={(e) => setNewNoteTimestamp(e.target.value)}
                  className="flex-1 bg-surface-50 text-zinc-300 text-xs rounded-lg px-2 py-1 border border-zinc-700 focus:border-accent outline-none font-mono"
                />
              </div>
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                添加备注
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
