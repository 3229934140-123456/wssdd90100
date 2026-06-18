import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS, CATEGORY_COLORS, NOTE_TYPE_LABELS, type Category } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, Merge, X, Calendar, TrendingUp, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'

const CATEGORIES: Category[] = ['abuse', 'boycott', 'quality', 'fake_ad', 'price', 'other']

const BADGE_CLASS: Record<Category, string> = {
  abuse: 'badge-abuse',
  boycott: 'badge-boycott',
  quality: 'badge-quality',
  fake_ad: 'badge-fake_ad',
  price: 'badge-price',
  other: 'badge-other',
}

const CAT_BTN_ACTIVE: Record<Category, string> = {
  abuse: 'bg-cat-abuse/15 text-cat-abuse border-l-2 border-cat-abuse',
  boycott: 'bg-cat-boycott/15 text-cat-boycott border-l-2 border-cat-boycott',
  quality: 'bg-cat-quality/15 text-cat-quality border-l-2 border-cat-quality',
  fake_ad: 'bg-cat-fake_ad/15 text-cat-fake_ad border-l-2 border-cat-fake_ad',
  price: 'bg-cat-price/15 text-cat-price border-l-2 border-cat-price',
  other: 'bg-cat-other/15 text-cat-other border-l-2 border-cat-other',
}

function DraggableWordCard({
  groupId, mainWord, mergedWords, totalCount, category,
  isHighlighted, onSelect, isSelected,
}: {
  groupId: string; mainWord: string; mergedWords: string[]; totalCount: number; category: Category
  isHighlighted: boolean
  onSelect: () => void
  isSelected: boolean
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: groupId })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: groupId })
  const unmergeWord = useStore((s) => s.unmergeWord)
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={(node) => { setDragRef(node); setDropRef(node); cardRef.current = node as HTMLDivElement }}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      className={`card flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-95' : ''
      } ${isOver ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : ''} ${
        isSelected ? 'ring-2 ring-white/50' : ''
      } ${isHighlighted && !isSelected ? 'ring-2 ring-accent/50 animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-zinc-600 shrink-0" />
          <span className="font-display font-bold text-zinc-100 truncate">{mainWord}</span>
          {mergedWords.length > 1 && (
            <span className={`${BADGE_CLASS[category]} flex items-center gap-1 shrink-0`}>
              <Merge className="w-3 h-3" />已合并
            </span>
          )}
        </div>
        <span className="font-mono text-sm text-zinc-400 shrink-0">{totalCount.toLocaleString()}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {mergedWords.map((w) => (
          <span key={w} className="inline-flex items-center gap-1 bg-surface-200 text-zinc-300 text-xs px-2 py-0.5 rounded">
            {w}
            {w !== mainWord && (
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); unmergeWord(groupId, w) }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

function DragOverlayCard({ mainWord, totalCount, category }: {
  mainWord: string; totalCount: number; category: Category
}) {
  return (
    <div className="card flex items-center gap-3 shadow-xl shadow-black/40 opacity-90 rotate-2">
      <GripVertical className="w-4 h-4 text-zinc-600" />
      <span className="font-display font-bold text-zinc-100">{mainWord}</span>
      <span className={`${BADGE_CLASS[category]}`}>
        <Merge className="w-3 h-3" />
      </span>
      <span className="font-mono text-sm text-zinc-400">{totalCount.toLocaleString()}</span>
    </div>
  )
}

export default function Attribution() {
  const [activeCat, setActiveCat] = useState<Category>('abuse')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const wordGroups = useStore((s) => s.wordGroups)
  const mergeWords = useStore((s) => s.mergeWords)
  const highlightedGroupId = useStore((s) => s.selectedWordGroupId)
  const clearHighlighted = useStore((s) => s.setSelectedWordGroupId)
  const getSpikesForWord = useStore((s) => s.getSpikesForWord)
  const setSelectedTimelineEventId = useStore((s) => s.setSelectedTimelineEventId)
  const records = useStore((s) => s.records)

  const navigate = useNavigate()
  const highlightedRef = useRef<HTMLDivElement>(null)

  const filteredGroups = wordGroups.filter((g) => g.category === activeCat)
  const draggingGroup = wordGroups.find((g) => g.id === draggingId)
  const selectedGroup = wordGroups.find((g) => g.id === selectedGroupId) || (highlightedGroupId ? wordGroups.find((g) => g.id === highlightedGroupId) : null)

  const chartData = filteredGroups.map((g) => ({ name: g.mainWord, count: g.totalCount }))

  const relatedSpikes = (() => {
    if (!selectedGroup) return []
    const spikes = new Set(selectedGroup.mergedWords.flatMap((w) => getSpikesForWord(w)))
    return Array.from(spikes).sort((a, b) => b.magnitude - a.magnitude).slice(0, 8)
  })()

  useEffect(() => {
    if (highlightedGroupId) {
      const group = wordGroups.find((g) => g.id === highlightedGroupId)
      if (group && group.category !== activeCat) {
        setActiveCat(group.category)
      }
      setSelectedGroupId(highlightedGroupId)
      const t = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return () => clearTimeout(t)
    }
  }, [highlightedGroupId, wordGroups, activeCat])

  function handleDragStart(event: DragEndEvent) {
    setDraggingId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    mergeWords(active.id as string, over.id as string)
  }

  const jumpToSpike = (eventId: string) => {
    setSelectedTimelineEventId(eventId)
    navigate('/timeline')
  }

  return (
    <div className="p-6 flex h-screen gap-6">
      <nav className="flex flex-col gap-2 w-28 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { setActiveCat(cat); setSelectedGroupId(null) }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeCat === cat
                ? CAT_BTN_ACTIVE[cat]
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </nav>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2">
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredGroups.map((g) => (
                  <div key={g.id} ref={g.id === highlightedGroupId ? highlightedRef : undefined}>
                    <DraggableWordCard
                      groupId={g.id}
                      mainWord={g.mainWord}
                      mergedWords={g.mergedWords}
                      totalCount={g.totalCount}
                      category={g.category}
                      isHighlighted={g.id === highlightedGroupId}
                      isSelected={g.id === selectedGroupId}
                      onSelect={() => {
                        setSelectedGroupId(selectedGroupId === g.id ? null : g.id)
                        if (highlightedGroupId) clearHighlighted(null)
                      }}
                    />
                  </div>
                ))}
              </div>
              <DragOverlay>
                {draggingGroup && (
                  <DragOverlayCard
                    mainWord={draggingGroup.mainWord}
                    totalCount={draggingGroup.totalCount}
                    category={draggingGroup.category}
                  />
                )}
              </DragOverlay>
            </DndContext>

            {filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-600 text-sm gap-2">
                {records.length === 0 ? (
                  <>暂无数据，请先导入敏感词记录或加载演示数据</>
                ) : (
                  <>该分类暂无词组数据</>
                )}
              </div>
            )}
          </div>

          <div className="card shrink-0">
            <h3 className="font-display font-bold text-sm text-zinc-300 mb-3">
              {CATEGORY_LABELS[activeCat]} · 词频分布
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} fontFamily="JetBrains Mono" />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 13 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2A2D35', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[activeCat]} fillOpacity={0.7 + i * 0.05} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {selectedGroup && (
          <div className="w-80 shrink-0 border-l border-zinc-800 pl-6 flex flex-col gap-4 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-display font-bold text-zinc-100">
                  {selectedGroup.mainWord}
                </h2>
                <button
                  onClick={() => { setSelectedGroupId(null); clearHighlighted(null) }}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${BADGE_CLASS[selectedGroup.category]}`}>
                  {CATEGORY_LABELS[selectedGroup.category]}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  共 {selectedGroup.totalCount} 次命中
                </span>
              </div>
              {selectedGroup.mergedWords.length > 1 && (
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 mb-1">已合并词组：</p>
                  {selectedGroup.mergedWords.map((w) => (
                    <span key={w} className="inline-flex bg-surface-50 text-zinc-300 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <h3 className="text-xs font-display font-bold text-zinc-400 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-accent" />
                相关爆发节点 · {relatedSpikes.length} 个
              </h3>
              {relatedSpikes.length === 0 ? (
                <p className="text-xs text-zinc-600">暂未关联到爆发节点</p>
              ) : (
                <div className="space-y-1.5">
                  {relatedSpikes.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => jumpToSpike(ev.id)}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-surface-50 hover:bg-surface-200 group transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                        <span className="text-xs font-mono text-zinc-300 truncate">{ev.date}</span>
                        <span className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden shrink-0">
                          <span
                            className="h-full block"
                            style={{
                              width: `${ev.magnitude}%`,
                              backgroundColor: ev.magnitude >= 70 ? '#EF4444' : ev.magnitude >= 40 ? '#F97316' : '#EAB308',
                            }}
                          />
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-accent">{ev.magnitude}%</span>
                        <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-accent transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-zinc-600 mt-2">
                点击节点跳转至时间线查看详情
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
