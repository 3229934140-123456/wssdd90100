import { useState, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { CATEGORY_LABELS, CHANNEL_LABELS } from '@/types'
import type { Category, Channel } from '@/types'
import { Upload, FileSpreadsheet, Database, Hash, Calendar, AlertTriangle } from 'lucide-react'

const CHANNEL_COLORS: Record<Channel, string> = {
  weibo: 'bg-red-500/20 text-red-400',
  douyin: 'bg-cyan-500/20 text-cyan-400',
  xiaohongshu: 'bg-pink-500/20 text-pink-400',
  wechat: 'bg-green-500/20 text-green-400',
  other: 'bg-zinc-500/20 text-zinc-400',
}

const CATEGORY_BADGE: Record<Category, string> = {
  abuse: 'badge-abuse',
  boycott: 'badge-boycott',
  quality: 'badge-quality',
  fake_ad: 'badge-fake_ad',
  price: 'badge-price',
}

export default function DataImport() {
  const records = useStore((s) => s.records)
  const dataLoaded = useStore((s) => s.dataLoaded)
  const loadMockData = useStore((s) => s.loadMockData)
  const setRecords = useStore((s) => s.setRecords)
  const [dragOver, setDragOver] = useState(false)

  const totalRecords = records.length
  const totalHits = records.reduce((sum, r) => sum + r.count, 0)
  const uniqueWords = new Set(records.map((r) => r.word)).size
  const dates = records.map((r) => r.hitTime).sort()
  const dateRange = dates.length > 0 ? `${dates[0].slice(0, 10)} ~ ${dates[dates.length - 1].slice(0, 10)}` : '-'

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.trim().split('\n')
        if (lines.length < 2) return
        const headers = lines[0].split(',')
        const parsed = lines.slice(1).map((line, i) => {
          const vals = line.split(',')
          return {
            id: `imp-${i}`,
            word: vals[headers.indexOf('word')] || '',
            category: (vals[headers.indexOf('category')] || 'abuse') as Category,
            hitTime: vals[headers.indexOf('hitTime')] || '',
            source: vals[headers.indexOf('source')] || '',
            channel: (vals[headers.indexOf('channel')] || 'other') as Channel,
            count: Number(vals[headers.indexOf('count')] || 0),
          }
        })
        setRecords(parsed)
      }
      reader.readAsText(file)
    },
    [setRecords],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const previewRecords = records.slice(0, 20)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-display font-bold">数据导入</h1>

      {dataLoaded && (
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card">
            <span className="stat-label"><Database className="inline w-3.5 h-3.5 mr-1" />总记录数</span>
            <span className="stat-value">{totalRecords}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><AlertTriangle className="inline w-3.5 h-3.5 mr-1" />总命中次数</span>
            <span className="stat-value">{totalHits}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><Hash className="inline w-3.5 h-3.5 mr-1" />独立敏感词</span>
            <span className="stat-value">{uniqueWords}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><Calendar className="inline w-3.5 h-3.5 mr-1" />日期范围</span>
            <span className="stat-value text-lg">{dateRange}</span>
          </div>
        </div>
      )}

      {!dataLoaded ? (
        <div className="card flex flex-col items-center gap-6 py-16">
          <div
            className={`w-full max-w-lg border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-4 transition-colors ${dragOver ? 'border-accent bg-accent/10' : 'border-zinc-700'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <Upload className="w-10 h-10 text-zinc-500" />
            <p className="text-zinc-400">拖放 CSV 文件到此处</p>
            <label className="btn-primary cursor-pointer flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              选择文件
              <input type="file" accept=".csv" className="hidden" onChange={onFileInput} />
            </label>
          </div>
          <div className="text-zinc-600 text-sm">或</div>
          <button className="btn-primary px-8 py-3 text-lg flex items-center gap-2" onClick={loadMockData}>
            <Database className="w-5 h-5" />
            加载演示数据
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">数据预览</h2>
              <span className="text-xs text-zinc-500">显示前 {previewRecords.length} 条 / 共 {totalRecords} 条</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                    <th className="pb-2 pr-4 font-medium">敏感词</th>
                    <th className="pb-2 pr-4 font-medium">类别</th>
                    <th className="pb-2 pr-4 font-medium">渠道</th>
                    <th className="pb-2 pr-4 font-medium">命中时间</th>
                    <th className="pb-2 pr-4 font-medium">来源</th>
                    <th className="pb-2 font-medium text-right">命中次数</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRecords.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-surface-50/50">
                      <td className="py-2 pr-4 font-medium">{r.word}</td>
                      <td className="py-2 pr-4"><span className={CATEGORY_BADGE[r.category]}>{CATEGORY_LABELS[r.category]}</span></td>
                      <td className="py-2 pr-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLORS[r.channel]}`}>{CHANNEL_LABELS[r.channel]}</span></td>
                      <td className="py-2 pr-4 text-zinc-400 font-mono text-xs">{r.hitTime.slice(0, 16)}</td>
                      <td className="py-2 pr-4 text-zinc-400 truncate max-w-[200px]">{r.source}</td>
                      <td className="py-2 text-right font-mono text-accent">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div
            className={`card border-2 border-dashed flex items-center justify-center gap-3 py-4 transition-colors cursor-pointer ${dragOver ? 'border-accent bg-accent/10' : 'border-zinc-700'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <Upload className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-500 text-sm">拖放 CSV 文件追加数据</span>
            <label className="text-accent text-sm cursor-pointer hover:underline">
              选择文件
              <input type="file" accept=".csv" className="hidden" onChange={onFileInput} />
            </label>
          </div>
        </>
      )}
    </div>
  )
}
