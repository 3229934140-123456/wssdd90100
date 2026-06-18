import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { CHANNEL_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, type Channel, type Priority, type WatchItem, type Category, type ReportSnapshot } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { AlertTriangle, TrendingUp, Clock, ListChecks, Plus, Trash2, Edit3, FileText, Filter, Calendar, Sparkles, Check, X, Zap, Save, History, GitCompare, Download, ChevronDown, ChevronUp, Copy as CopyIcon, AlertCircle } from 'lucide-react'

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

const allCategories: (Category | 'all')[] = ['all', ...(Object.keys(CATEGORY_LABELS) as Category[])]

export default function Report() {
  const getTopWords = useStore((s) => s.getTopWords)
  const channelDist = useStore((s) => s.getChannelDistribution())
  const getCategoryDistribution = useStore((s) => s.getCategoryDistribution)
  const watchItems = useStore((s) => s.watchItems)
  const disposalTimes = useStore((s) => s.getDisposalTimes())
  const getSpikeSummaries = useStore((s) => s.getSpikeSummaries)
  const getDateRange = useStore((s) => s.getDateRange)
  const addWatchItem = useStore((s) => s.addWatchItem)
  const removeWatchItem = useStore((s) => s.removeWatchItem)
  const updateWatchItem = useStore((s) => s.updateWatchItem)
  const records = useStore((s) => s.records)
  const snapshots = useStore((s) => s.snapshots)
  const saveSnapshot = useStore((s) => s.saveSnapshot)
  const deleteSnapshot = useStore((s) => s.deleteSnapshot)
  const restoreSnapshot = useStore((s) => s.restoreSnapshot)

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

  const [showSnapshots, setShowSnapshots] = useState(false)
  const [snapNameInput, setSnapNameInput] = useState('')
  const [showSaveSnapDialog, setShowSaveSnapDialog] = useState(false)
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [expandedSnap, setExpandedSnap] = useState<string | null>(null)

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
  }, [dateRange, filteredSpikes, filteredTopWords, categoryDist, filteredPairs, summaryFilterCat, records.length])

  const timelineEvents = useStore((s) => s.timelineEvents)

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
    if (editReason.trim()) updateWatchItem(id, { reason: editReason.trim() })
    setEditingId(null)
    setEditReason('')
  }

  const applyFiltersToSummary = () => setSummaryText(autoSummary)
  const saveSummaryEdit = () => setSummaryEditing(false)
  const resetSummaryToAuto = () => { setSummaryText(autoSummary); setSummaryEditing(false) }

  const currentFilter: ReportSnapshot['filter'] = {
    category: summaryFilterCat,
    startDate: summaryStart,
    endDate: summaryEnd,
  }

  const doSaveSnapshot = () => {
    const name = snapNameInput.trim() || `快照 ${new Date().toLocaleString('zh-CN')}`
    saveSnapshot(name, currentFilter, summaryText)
    setShowSaveSnapDialog(false)
    setSnapNameInput('')
  }

  const exportCurrent = () => {
    const snap: any = {
      name: `复盘报告 ${new Date().toLocaleString('zh-CN')}`,
      exportedAt: new Date().toISOString(),
      filter: currentFilter,
      summary: summaryText,
      topWords: filteredTopWords,
      watchItems,
      disposalTimes: {
        avg: disposalTimes.avg, max: disposalTimes.max, min: disposalTimes.min,
        pairs: filteredPairs.map((p) => ({ spike: p.spike, response: p.response, hours: p.hours, type: p.type })),
      },
      channelDist,
      totalRecords: filteredRecords.length,
      totalHits: filteredRecords.reduce((s, r) => s + r.count, 0),
    }
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
  }

  const copyText = (t: string) => {
    navigator.clipboard?.writeText(t)
  }

  const getSnapA = () => snapshots.find((s) => s.id === compareA) || null
  const getSnapB = () => snapshots.find((s) => s.id === compareB) || null

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">复盘报告</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="btn-ghost text-sm">
            <History className="w-4 h-4 mr-1" />
            版本历史 ({snapshots.length})
          </button>
          <button onClick={() => {
            setShowSaveSnapDialog(true)
            setSnapNameInput(`复盘 ${new Date().toLocaleString('zh-CN')}`)
          }} className="btn-ghost text-sm">
            <Save className="w-4 h-4 mr-1" />保存快照
          </button>
          <button onClick={() => setShowExportDialog(true)} className="btn-primary text-sm">
            <Download className="w-4 h-4 mr-1" />导出报告
          </button>
        </div>
      </div>

      {showSaveSnapDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveSnapDialog(false)}>
          <div className="card w-[420px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display font-bold text-base mb-3">保存快照</h3>
            <p className="text-xs text-zinc-500 mb-3">保存当前筛选条件、摘要文字、Top词组和关注词，方便后续对比或回退</p>
            <input
              value={snapNameInput}
              onChange={(e) => setSnapNameInput(e.target.value)}
              placeholder="快照名称"
              className="w-full bg-surface-200 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowSaveSnapDialog(false)} className="btn-ghost text-sm">取消</button>
              <button onClick={doSaveSnapshot} className="btn-primary text-sm">
                <Save className="w-4 h-4 mr-1" />保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowExportDialog(false)}>
          <div className="card w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base">导出前确认</h3>
              <button onClick={() => setShowExportDialog(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-surface-50 rounded-lg p-3 border border-accent/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-zinc-300 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-accent" />请确认以下为最终导出内容
                  </p>
                  <span className="text-[10px] text-zinc-500 bg-surface-200 px-2 py-0.5 rounded">
                    筛选：{summaryFilterCat === 'all' ? '全部分类' : CATEGORY_LABELS[summaryFilterCat]}
                    {summaryStart && ` · ${summaryStart}起`}{summaryEnd && ` · 至${summaryEnd}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                  <div><span className="text-zinc-500">命中次数：</span><span className="text-accent font-mono">{filteredRecords.reduce((s, r) => s + r.count, 0).toLocaleString()}</span></div>
                  <div><span className="text-zinc-500">爆发节点：</span><span className="text-zinc-200 font-mono">{filteredSpikes.length}</span></div>
                  <div><span className="text-zinc-500">关注词：</span><span className="text-zinc-200 font-mono">{watchItems.length}</span></div>
                  <div><span className="text-zinc-500">响应节点：</span><span className="text-emerald-400 font-mono">{filteredPairs.length}</span></div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-zinc-300 mb-2 text-xs flex items-center justify-between">
                  <span>复盘摘要</span>
                  <button onClick={() => copyText(summaryText)} className="btn-ghost text-[10px] px-2 py-0.5">
                    <CopyIcon className="w-3 h-3 mr-1" />复制
                  </button>
                </p>
                <div className="bg-surface-50 rounded-lg p-3 text-zinc-200 text-xs leading-6 max-h-40 overflow-y-auto">
                  {summaryText || <span className="text-zinc-600">（无摘要）</span>}
                </div>
              </div>

              <div>
                <p className="font-semibold text-zinc-300 mb-2 text-xs">高频词组（前10）</p>
                <div className="bg-surface-50 rounded-lg p-3">
                  <table className="w-full text-xs">
                    <thead><tr className="text-zinc-500">
                      <th className="text-left py-1 pr-3">词组</th><th className="text-left py-1 pr-3">分类</th><th className="text-right py-1">次数</th>
                    </tr></thead>
                    <tbody>
                      {filteredTopWords.slice(0, 10).map((w) => (
                        <tr key={w.word} className="border-t border-zinc-800/50">
                          <td className="py-1 pr-3 text-zinc-200">{w.word}</td>
                          <td className="py-1 pr-3 text-zinc-400">{CATEGORY_LABELS[w.category]}</td>
                          <td className="py-1 text-right font-mono text-accent">{w.count}</td>
                        </tr>
                      ))}
                      {filteredTopWords.length === 0 && (
                        <tr><td colSpan={3} className="py-2 text-center text-zinc-600">无数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredPairs.length > 0 && (
                <div>
                  <p className="font-semibold text-zinc-300 mb-2 text-xs">处置时效明细</p>
                  <div className="bg-surface-50 rounded-lg p-3">
                    <table className="w-full text-xs">
                      <thead><tr className="text-zinc-500">
                        <th className="text-left py-1 pr-3">爆发</th><th className="text-left py-1 pr-3">回应</th><th className="text-left py-1 pr-3">类型</th><th className="text-right py-1">小时</th>
                      </tr></thead>
                      <tbody>
                        {filteredPairs.map((p, i) => (
                          <tr key={i} className="border-t border-zinc-800/50">
                            <td className="py-1 pr-3 text-zinc-200 truncate max-w-[120px]">{p.spike}</td>
                            <td className="py-1 pr-3 text-zinc-400 truncate max-w-[180px]">{p.response}</td>
                            <td className="py-1 pr-3 text-zinc-400">{NOTE_TYPE_LABELS[p.type] || p.type}</td>
                            <td className="py-1 text-right font-mono text-accent">{p.hours.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {watchItems.length > 0 && (
                <div>
                  <p className="font-semibold text-zinc-300 mb-2 text-xs">关注词清单（{watchItems.length}）</p>
                  <div className="bg-surface-50 rounded-lg p-3 space-y-1 text-xs max-h-32 overflow-y-auto">
                    {watchItems.map((w) => (
                      <div key={w.id} className="flex items-center gap-2">
                        <span className={`badge ${PRIORITY_BADGE[w.priority]}`}>{PRIORITY_LABELS[w.priority]}</span>
                        <span className="font-medium text-zinc-200">{w.word}</span>
                        {w.reason && <span className="text-zinc-500 truncate flex-1">— {w.reason}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-zinc-800">
              <button onClick={() => setShowExportDialog(false)} className="btn-ghost text-sm">再看看</button>
              <button onClick={exportCurrent} className="btn-primary text-sm">
                <Download className="w-4 h-4 mr-1" />确认导出 JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {showSnapshots && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm text-zinc-300 flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              报告快照
            </h2>
            {snapshots.length >= 2 && (
              <div className="flex items-center gap-2">
                <GitCompare className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500">对比</span>
                <select
                  value={compareA || ''}
                  onChange={(e) => setCompareA(e.target.value || null)}
                  className="bg-surface-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">选择 A</option>
                  {snapshots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span className="text-zinc-500">vs</span>
                <select
                  value={compareB || ''}
                  onChange={(e) => setCompareB(e.target.value || null)}
                  className="bg-surface-200 border border-zinc-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent"
                >
                  <option value="">选择 B</option>
                  {snapshots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {compareA && compareB && getSnapA() && getSnapB() && (
            <div className="mb-4 border border-zinc-700 rounded-lg overflow-hidden">
              <div className="grid grid-cols-2 bg-surface-50 text-xs">
                <div className="px-3 py-2 border-r border-zinc-800">
                  <p className="font-bold text-accent">A · {getSnapA()!.name}</p>
                  <p className="text-zinc-500 font-mono">{new Date(getSnapA()!.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div className="px-3 py-2">
                  <p className="font-bold text-indigo-400">B · {getSnapB()!.name}</p>
                  <p className="text-zinc-500 font-mono">{new Date(getSnapB()!.createdAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-zinc-800 text-xs">
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">命中</p>
                  <p className="font-mono text-zinc-200">{getSnapA()!.totalHits.toLocaleString()} 次 / {getSnapA()!.totalRecords} 条</p>
                </div>
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">命中</p>
                  <p className={`font-mono ${getSnapB()!.totalHits > getSnapA()!.totalHits ? 'text-red-400' : getSnapB()!.totalHits < getSnapA()!.totalHits ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {getSnapB()!.totalHits.toLocaleString()} 次 / {getSnapB()!.totalRecords} 条
                  </p>
                </div>
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">平均处置</p>
                  <p className="font-mono text-zinc-200">{getSnapA()!.disposalTimes.avg.toFixed(1)}h</p>
                </div>
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">平均处置</p>
                  <p className={`font-mono ${getSnapB()!.disposalTimes.avg < getSnapA()!.disposalTimes.avg ? 'text-emerald-400' : getSnapB()!.disposalTimes.avg > getSnapA()!.disposalTimes.avg ? 'text-red-400' : 'text-zinc-200'}`}>
                    {getSnapB()!.disposalTimes.avg.toFixed(1)}h
                  </p>
                </div>
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">关注词</p>
                  <p className="font-mono text-zinc-200">{getSnapA()!.watchItems.length}</p>
                </div>
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">关注词</p>
                  <p className={`font-mono ${getSnapB()!.watchItems.length !== getSnapA()!.watchItems.length ? 'text-accent' : 'text-zinc-200'}`}>
                    {getSnapB()!.watchItems.length}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-zinc-800 text-xs">
                <div className="bg-surface-100 p-3 col-span-2">
                  <p className="text-zinc-500 mb-1">摘要差异</p>
                  <div className="grid grid-cols-2 gap-3">
                    <p className="text-[11px] text-zinc-300 leading-5">{getSnapA()!.summary || '—'}</p>
                    <p className="text-[11px] text-zinc-300 leading-5">{getSnapB()!.summary || '—'}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-zinc-800 text-xs">
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">Top 词组</p>
                  <ul className="space-y-0.5">
                    {getSnapA()!.topWords.slice(0, 5).map((w) => (
                      <li key={w.word} className="flex items-center justify-between">
                        <span className="text-zinc-300 truncate">{w.word}</span>
                        <span className="font-mono text-zinc-400 ml-2">{w.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-surface-100 p-3">
                  <p className="text-zinc-500 mb-1">Top 词组</p>
                  <ul className="space-y-0.5">
                    {getSnapB()!.topWords.slice(0, 5).map((w) => {
                      const inA = getSnapA()!.topWords.find((a) => a.word === w.word)
                      return (
                        <li key={w.word} className="flex items-center justify-between">
                          <span className={`truncate ${inA ? 'text-zinc-300' : 'text-emerald-400'}`}>{w.word}</span>
                          <span className={`font-mono ml-2 ${inA && w.count !== inA.count ? 'text-accent' : 'text-zinc-400'}`}>
                            {w.count}{inA && w.count !== inA.count && <span className="text-[10px]"> ({w.count - inA.count > 0 ? '+' : ''}{w.count - inA.count})</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {snapshots.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 text-sm">还没有保存过快照，点右上角「保存快照」创建第一版</div>
          ) : (
            <div className="space-y-1.5">
              {snapshots.map((snap) => {
                const isOpen = expandedSnap === snap.id
                return (
                  <div key={snap.id} className="bg-surface-50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2">
                      <button onClick={() => setExpandedSnap(isOpen ? null : snap.id)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                        <span className="font-medium text-sm text-zinc-200 truncate">{snap.name}</span>
                      </button>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {new Date(snap.createdAt).toLocaleString('zh-CN')}
                        </span>
                        <span className="text-[10px] text-zinc-500 bg-surface-200 px-2 py-0.5 rounded">
                          {snap.filter.category === 'all' ? '全部分类' : CATEGORY_LABELS[snap.filter.category]}
                          {snap.filter.startDate && ` · ${snap.filter.startDate}`}{snap.filter.endDate && `~${snap.filter.endDate}`}
                        </span>
                        <button
                          onClick={() => {
                            const restored = restoreSnapshot(snap.id)
                            if (restored) {
                              setSummaryFilterCat(restored.filter.category)
                              setSummaryStart(restored.filter.startDate)
                              setSummaryEnd(restored.filter.endDate)
                              setSummaryText(restored.summary)
                              setShowSnapshots(false)
                            }
                          }}
                          className="text-[10px] text-accent hover:underline"
                        >恢复</button>
                        <button onClick={() => deleteSnapshot(snap.id)} className="text-[10px] text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-3 pb-3 pt-1 border-t border-zinc-800 space-y-2">
                        <div className="grid grid-cols-4 gap-3 text-xs">
                          <div><span className="text-zinc-500">命中：</span><span className="font-mono text-zinc-200">{snap.totalHits.toLocaleString()} 次</span></div>
                          <div><span className="text-zinc-500">记录：</span><span className="font-mono text-zinc-200">{snap.totalRecords}</span></div>
                          <div><span className="text-zinc-500">平均处置：</span><span className="font-mono text-zinc-200">{snap.disposalTimes.avg.toFixed(1)}h</span></div>
                          <div><span className="text-zinc-500">关注词：</span><span className="font-mono text-zinc-200">{snap.watchItems.length}</span></div>
                        </div>
                        <div className="text-xs text-zinc-300 bg-surface-200 rounded p-2 leading-5">
                          {snap.summary || <span className="text-zinc-600">（无摘要）</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
          {barData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-zinc-500 text-sm">
              {records.length === 0 ? '暂无数据' : '当前筛选下无数据'}
            </div>
          ) : (
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-base font-display font-bold flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-accent" />
            扩散渠道分析
          </h2>
          <div className="card flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">暂无数据</div>
            ) : (
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
            )}
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
          ) : disposalTimes.avg === 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-zinc-500">暂无数据</p>
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
