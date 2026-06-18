import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { CHANNEL_LABELS, PRIORITY_LABELS, type Channel, type Priority, type WatchItem } from '@/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { AlertTriangle, TrendingUp, Clock, ListChecks, Plus, Trash2, Edit3 } from 'lucide-react'

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

export default function Report() {
  const topWords = useStore((s) => s.getTopWords(15))
  const channelDist = useStore((s) => s.getChannelDistribution())
  const watchItems = useStore((s) => s.watchItems)
  const disposalTimes = useStore((s) => s.getDisposalTimes())
  const timelineEvents = useStore((s) => s.timelineEvents)
  const addWatchItem = useStore((s) => s.addWatchItem)
  const removeWatchItem = useStore((s) => s.removeWatchItem)
  const updateWatchItem = useStore((s) => s.updateWatchItem)

  const [showForm, setShowForm] = useState(false)
  const [formWord, setFormWord] = useState('')
  const [formPriority, setFormPriority] = useState<Priority>('high')
  const [formReason, setFormReason] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editReason, setEditReason] = useState('')

  const barData = topWords.map((w) => ({ name: w.word, value: w.count }))
  const pieData = channelDist.map((d) => ({
    name: CHANNEL_LABELS[d.channel],
    value: d.count,
    color: CHANNEL_COLORS[d.channel],
  }))

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

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <h1 className="text-2xl font-display font-bold">复盘报告</h1>

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
                  <Cell key={i} fill="#F97316" fillOpacity={0.5 + (i / barData.length) * 0.5} />
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
