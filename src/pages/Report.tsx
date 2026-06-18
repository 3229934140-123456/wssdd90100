import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { CHANNEL_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, type Channel, type Priority, type WatchItem, type Category } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { AlertTriangle, TrendingUp, Clock, ListChecks, Plus, Trash2, Edit3, FileText, Filter, Calendar, Sparkles, Check, X, Zap } from 'lucide-react'

const CHANNEL_COLORS: Record<Channel, string> = {
  weibo: '#E6162D',
  douyin: '#22D3EE',
  xiaohongshu: '#FE2C55',
  wechat: '#07C160',
  other: '#6B7280',
}

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  official_response: '官方回应',
  media_report: '媒体报道',
  influencer_repost: '达人转发',
  other: '其他备注',
}

export default function Report() {
  const getTopWords = useStore((s) => s.getTopWords)
  const channelDist = useStore((s) => s.getChannelDistribution())
  const getCategoryDistribution = useStore((s) => s.getCategoryDistribution)
  const watchItems = useStore((s) => s.watchItems)
  const disposalTimes = useStore((s) => s.getDisposalTimes())
  const timelineEvents = useStore((s) => s.timelineEvents)
  const getSpikeSummaries = useStore((s) => s.getSpikeSummaries)
  const getDateRange = useStore((s) => s.getDateRange)
  const addWatchItem = useStore((s) => s.addWatchItem)
  const removeWatchItem = useStore((s) => s.removeWatchItem)
  const updateWatchItem = useStore((s) => s.updateWatchItem)
  const records = useStore((s) => s.records)

  const [showForm, setShowForm] = useState(false)
  const [formWord, setFormWord] = useState('')
  const [formPriority, setFormPriority] = useState<Priority>('high')
  const [formReason, setFormReason] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editReason, setEditReason] = useState('')

  const [summaryFilterCat, setSummaryFilterCat] = useState<Category | 'all'>('all')
  const [summaryStart, setSummaryStart] = useState('')
  const [summaryEnd, setSummaryEnd] = useState('')
  const [summaryEditing, setSummaryEditing] = useState(false)
  const [summaryText, setSummaryText] = useState('')

  const allCategories: (Category | 'all')[] = ['all', ...Object.keys(CATEGORY_LABELS) as Category[]]

  const dateRange = getDateRange()
  const spikes = getSpikeSummaries()

  const categoryDist = getCategoryDistribution()
  const topWordsAll = getTopWords(50)

  const filteredTopWords = useMemo(() => {
    const words = summaryFilterCat === 'all'
      ? topWordsAll
      : topWordsAll.filter((w) => w.category === summaryFilterCat)
    return words.slice(0, 15)
  }, [topWordsAll, summaryFilterCat])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (summaryFilterCat !== 'all' && r.category !== summaryFilterCat) return false
      if (summaryStart && r.hitTime.slice(0, 10) < summaryStart) return false
      if (summaryEnd && r.hitTime.slice(0, 10) > summaryEnd) return false
      return true
    })
  }, [records, summaryFilterCat, summaryStart, summaryEnd])

  const filteredSpikes = useMemo(() => {
    return spikes.filter((s) => {
      if (summaryStart && s.date < summaryStart) return false
      if (summaryEnd && s.date > summaryEnd) return false
      return true
    })
  }, [spikes, summaryStart, summaryEnd])

  const filteredPairs = useMemo(() => {
    return disposalTimes.pairs.filter((p) => {
      const spike = spikes.find((s) => s.id === p.spikeId)
      if (!spike) return true
      if (summaryStart && spike.date < summaryStart) return false
      if (summaryEnd && spike.date > summaryEnd) return false
      return true
    })
  }, [disposalTimes.pairs, spikes, summaryStart, summaryEnd])

  const barData = filteredTopWords.map((w) => ({ name: w.word, value: w.count }))
  const pieData = channelDist.map((d) => ({
    name: CHANNEL_LABELS[d.channel],
    value: d.count,
    color: CHANNEL_COLORS[d.channel],
  }))

  const autoSummary = useMemo(() => {
    const parts: string[] = []
    const dr = dateRange
    if (dr) {
      parts.push(`本次复盘时间跨度为 ${dr.days} 天，从 ${dr.start} 到 ${dr.end}。`)
    }
    const catFilterStr = summaryFilterCat !== 'all' ? `（仅看「${CATEGORY_LABELS[summaryFilterCat]}」类）` : ''
    if (filteredSpikes.length > 0) {
      const sorted = [...filteredSpikes].sort((a, b) => b.magnitude - a.magnitude)
      const biggest = sorted[0]
      const biggestWords = biggest.topWords.map((t) => `"${t.word}"(${t.count}次)`).join('、')
      parts.push(`${catFilterStr}舆情主要集中在 ${filteredSpikes.map((s) => s.date).join('、')} 共 ${filteredSpikes.length} 个爆发节点，`)
      parts.push(`其中 ${biggest.date} 的激增最强（强度 ${biggest.magnitude}%），贡献词组为 ${biggestWords}。`)
    }
    if (filteredTopWords.length > 0) {
      const top3 = filteredTopWords.slice(0, 3).map((w) => `"${w.word}"(${w.count}次)`).join('、')
      parts.push(`高频敏感词 Top3 为 ${top3}，需重点关注。`)
    }
    if (categoryDist.length > 0) {
      const sortedCats = [...categoryDist].sort((a, b) => b.count - a.count)
      const topCat = sortedCats[0]
      parts.push(`从分类看，「${CATEGORY_LABELS[topCat.category]}」类占比最高（${topCat.count} 次命中）。`)
    }
    if (filteredPairs.length > 0) {
      const sorted = [...filteredPairs].sort((a, b) => a.hours - b.hours)
      const fastest = sorted[0]
      const slowest = sorted[sorted.length - 1]
      parts.push(`处置方面，最及时的回应是「${fastest.response.slice(0, 12)}${fastest.response.length > 12 ? '…' : ''}」（${NOTE_TYPE_LABELS[fastest.type]}，耗时 ${fastest.hours.toFixed(1)} 小时），`)
      parts.push(`耗时最长的是「${slowest.response.slice(0, 12)}${slowest.response.length > 12 ? '…' : ''}」（${NOTE_TYPE_LABELS[slowest.type]}，${slowest.hours.toFixed(1)} 小时）。`)
    } else if (timelineEvents.length > 0) {
      parts.push(`目前还没有标注官方回应/媒体报道/达人转发，处置时效暂无法评估。`)
    }
    return parts.join('')
  }, [dateRange, filteredSpikes, filteredTopWords, categoryDist, filteredPairs, timelineEvents.length, summaryFilterCat])

  useEffect(() => {
    if (!summaryEditing && autoSummary && summaryText !== autoSummary) {
      setSummaryText((prev) => prev === '' ? autoSummary : prev)
    }
  }, [autoSummary, summaryEditing, summaryText])

  const handleAdd = () => {
    if (!formWord.trim()) return
    addWatchItem(formWord.trim(), formPriority, formReason.trim())
    setFormWord('')
    setFormPriority('high')
    setFormReason('')
    setShowForm(false)
  }

  const handleEditSave = (id: string) => {
    if (editReason.trim()) {
      updateWatchItem(id, { reason: editReason.trim() })
    }
    setEditingId(null)
    setEditReason('')
  }

  const applyFiltersToSummary = () => {
    setSummaryText(autoSummary)
  }

  const saveSummaryEdit = () => {
    setSummaryEditing(false)
  }

  const resetSummaryToAuto = () => {
    setSummaryText(autoSummary)
    setSummaryEditing(false)
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-2xl font-display font-bold">复盘报告</h1>

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h2 className="text-base font-display font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            复盘摘要
            <span className="text-xs font-normal text-zinc-500 bg-surface-200 px-2 py-0.5 rounded">
              按分类/时间段生成 · 支持手动编辑
            </span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={summaryFilterCat}
                onChange={(e) => setSummaryFilterCat(e.target.value as Category | 'all')}
                className="bg-surface-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c === 'all' ? '全部分类' : CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Calendar className="w-3.5 h-3.5" />
              <input
                type="date"
                value={summaryStart}
                onChange={(e) => setSummaryStart(e.target.value)}
                className="bg-surface-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
              />
              <span>~</span>
              <input
                type="date"
                value={summaryEnd}
                onChange={(e) => setSummaryEnd(e.target.value)}
                className="bg-surface-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
              />
            </div>
            <button onClick={applyFiltersToSummary} className="btn-ghost text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />按筛选重算
            </button>
            {summaryEditing ? (
              <>
                <button onClick={saveSummaryEdit} className="btn-primary text-xs">
                  <Check className="w-3.5 h-3.5 mr-1" />保存
                </button>
                <button onClick={resetSummaryToAuto} className="btn-ghost text-xs text-zinc-400">
                  <X className="w-3.5 h-3.5 mr-1" />恢复自动
                </button>
              </>
            ) : (
              <button onClick={() => setSummaryEditing(true)} className="btn-ghost text-xs">
                <Edit3 className="w-3.5 h-3.5 mr-1" />编辑文字
              </button>
            )}
          </div>
        </div>

        <div className="card">
          {summaryEditing ? (
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              rows={6}
              className="w-full bg-surface-200 border border-accent/50 rounded-lg p-4 text-sm text-zinc-200 leading-relaxed focus:outline-none focus:border-accent resize-y"
            />
          ) : (
            <p className="text-sm text-zinc-200 leading-7 whitespace-pre-wrap">
              {summaryText || (
                <span className="text-zinc-500">
                  {records.length === 0
                    ? '暂无数据，请先导入敏感词记录或加载演示数据'
                    : autoSummary || '自动摘要生成中…'}
                </span>
              )}
            </p>
          )}
          {(filteredRecords.length > 0 || filteredSpikes.length > 0 || filteredPairs.length > 0) && (
            <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-4 gap-3 text-xs">
              <div>
                <p className="text-zinc-500 mb-1">命中次数</p>
                <p className="font-mono text-lg text-accent">
                  {filteredRecords.reduce((s, r) => s + r.count, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 mb-1">爆发节点</p>
                <p className="font-mono text-lg text-zinc-200">{filteredSpikes.length}</p>
              </div>
              <div>
                <p className="text-zinc-500 mb-1">独立词组</p>
                <p className="font-mono text-lg text-zinc-200">
                  {new Set(filteredRecords.map((r) => r.word)).size}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 mb-1">已响应节点</p>
                <p className="font-mono text-lg text-emerald-400">
                  {filteredPairs.length} / {filteredSpikes.length || '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredPairs.length > 0 && (
        <div>
          <h2 className="text-base font-display font-bold flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-accent" />
            处置时效明细
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2.5 px-3">爆发节点</th>
                  <th className="text-left py-2.5 px-3">最近回应</th>
                  <th className="text-left py-2.5 px-3">类型</th>
                  <th className="text-right py-2.5 px-3">耗时（小时）</th>
                </tr>
              </thead>
              <tbody>
                {filteredPairs.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-surface-50/50">
                    <td className="py-2.5 px-3 text-zinc-200">{p.spike}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{p.response}</td>
                    <td className="py-2.5 px-3">
                      <span className={`badge ${
                        p.type === 'official_response' ? 'bg-indigo-500/20 text-indigo-400' :
                        p.type === 'media_report' ? 'bg-cyan-500/20 text-cyan-400' :
                        p.type === 'influencer_repost' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {NOTE_TYPE_LABELS[p.type] || p.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className={
                        p.hours <= 2 ? 'text-emerald-400' :
                        p.hours <= 8 ? 'text-accent' : 'text-red-400'
                      }>{p.hours.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-display font-bold flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          高频敏感词 Top 15
        </h2>
        <div className="card">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} fontFamily="JetBrains Mono" />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 13 }} width={72} />
              <Tooltip
                contentStyle={{ backgroundColor: '#2A2D35', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Bar dataKey="value" fill="#F97316" radius={[0, 4, 4, 0]} barSize={16}>
                {barData.map((_, i) => (
                  <Cell key={i} fill="#F97316" fillOpacity={0.5 + (i / Math.max(1, barData.length)) * 0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-display font-bold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-accent" />
            扩散渠道分析
          </h2>
          <div className="card flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#2A2D35', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: '#e4e4e7' }}
                />
                <Legend formatter={(value) => <span className="text-zinc-300 text-sm">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="text-base font-display font-bold flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-accent" />
            处置时效
          </h2>
          {disposalTimes.avg === 0 && timelineEvents.length > 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-zinc-500">
                暂无官方回应/媒体报道/达人转发数据<br />
                请先在事件时间线中添加备注
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="stat-card">
                <span className="stat-label">平均响应时间</span>
                <span className="stat-value text-indigo-400">{disposalTimes.avg.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">小时</span></span>
              </div>
              <div className="stat-card">
                <span className="stat-label">最长响应时间</span>
                <span className="stat-value text-red-400">{disposalTimes.max.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">小时</span></span>
              </div>
              <div className="stat-card">
                <span className="stat-label">最短响应时间</span>
                <span className="stat-value text-emerald-400">{disposalTimes.min.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">小时</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display font-bold flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-accent" />
            后续关注词清单
          </h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-ghost flex items-center gap-1 text-sm">
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>

        {showForm && (
          <div className="card mb-3 flex items-center gap-3">
            <input
              value={formWord}
              onChange={(e) => setFormWord(e.target.value)}
              placeholder="敏感词"
              className="bg-surface-200 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-accent"
            />
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as Priority)}
              className="bg-surface-200 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="关注原因"
              className="bg-surface-200 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:border-accent"
            />
            <button onClick={handleAdd} className="btn-primary text-sm px-3 py-1.5">确认</button>
          </div>
        )}

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left py-2.5 px-3">敏感词</th>
                <th className="text-left py-2.5 px-3">优先级</th>
                <th className="text-left py-2.5 px-3">关注原因</th>
                <th className="text-right py-2.5 px-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {watchItems.map((item) => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-surface-50/50">
                  <td className="py-2.5 px-3 font-medium">{item.word}</td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${PRIORITY_BADGE[item.priority]}`}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    {editingId === item.id ? (
                      <input
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        onBlur={() => handleEditSave(item.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(item.id)}
                        className="bg-surface-200 border border-zinc-700 rounded-lg px-2 py-0.5 text-sm w-full focus:outline-none focus:border-accent"
                        autoFocus
                      />
                    ) : (
                      item.reason
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingId(item.id); setEditReason(item.reason) }}
                        className="btn-ghost p-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeWatchItem(item.id)} className="btn-ghost p-1 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {watchItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-600">暂无关注词</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
