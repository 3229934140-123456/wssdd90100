import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical, Merge, X } from 'lucide-react'

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

function DraggableWordCard({ groupId, mainWord, mergedWords, totalCount, category }: {
  groupId: string; mainWord: string; mergedWords: string[]; totalCount: number; category: Category
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: groupId })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: groupId })
  const unmergeWord = useStore((s) => s.unmergeWord)

  return (
    <div
      ref={(node) => { setDragRef(node); setDropRef(node) }}
      {...attributes}
      {...listeners}
      className={`card flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-95' : ''
      } ${isOver ? 'ring-2 ring-accent shadow-lg shadow-accent/20' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-zinc-600" />
          <span className="font-display font-bold text-zinc-100">{mainWord}</span>
          {mergedWords.length > 1 && (
            <span className={`${BADGE_CLASS[category]} flex items-center gap-1`}>
              <Merge className="w-3 h-3" />已合并
            </span>
          )}
        </div>
        <span className="font-mono text-sm text-zinc-400">{totalCount.toLocaleString()}</span>
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
  const wordGroups = useStore((s) => s.wordGroups)
  const mergeWords = useStore((s) => s.mergeWords)

  const filteredGroups = wordGroups.filter((g) => g.category === activeCat)
  const draggingGroup = wordGroups.find((g) => g.id === draggingId)

  const chartData = filteredGroups.map((g) => ({ name: g.mainWord, count: g.totalCount }))

  function handleDragStart(event: DragEndEvent) {
    setDraggingId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromId = active.id as string
    const toId = over.id as string

    mergeWords(fromId, toId)
  }

  return (
    <div className="p-6 flex h-screen gap-6">
      <nav className="flex flex-col gap-2 w-28 shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCat(cat)}
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

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredGroups.map((g) => (
                <DraggableWordCard
                  key={g.id}
                  groupId={g.id}
                  mainWord={g.mainWord}
                  mergedWords={g.mergedWords}
                  totalCount={g.totalCount}
                  category={g.category}
                />
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
            <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
              该分类暂无词组数据
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
    </div>
  )
}
