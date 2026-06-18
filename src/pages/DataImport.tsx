import { useState, useCallback, useMemo } from 'react'
import { useStore, parseSafeInt } from '@/store/useStore'
import { CATEGORY_LABELS, CHANNEL_LABELS, CATEGORY_COLORS } from '@/types'
import type { Category, Channel, SensitiveRecord } from '@/types'
import { Upload, FileSpreadsheet, Database, Hash, Calendar, AlertTriangle, AlertCircle, Plus, RefreshCw, XCircle, FileQuestion } from 'lucide-react'

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
  other: 'badge-other',
}

const VALID_CATEGORIES: Category[] = ['abuse', 'boycott', 'quality', 'fake_ad', 'price', 'other']
const VALID_CHANNELS: Channel[] = ['weibo', 'douyin', 'xiaohongshu', 'wechat', 'other']

interface ParsingReport {
  total: number
  valid: number
  skipped: number
  categoryFallback: number
  channelFallback: number
  countFallback: number
  mode: 'replace' | 'append' | 'none'
}

export default function DataImport() {
  const records = useStore((s) => s.records)
  const dataLoaded = useStore((s) => s.dataLoaded)
  const loadMockData = useStore((s) => s.loadMockData)
  const setRecords = useStore((s) => s.setRecords)
  const addRecords = useStore((s) => s.addRecords)
  const [dragOver, setDragOver] = useState(false)
  const [appendDragOver, setAppendDragOver] = useState(false)
  const [report, setReport] = useState<ParsingReport | null>(null)

  const totalRecords = records.length
  const totalHits = records.reduce((sum, r) => sum + r.count, 0)
  const uniqueWords = new Set(records.map((r) => r.word)).size
  const dates = records.map((r) => r.hitTime).sort()
  const dateRange = dates.length > 0 ? `${dates[0].slice(0, 10)} ~ ${dates[dates.length - 1].slice(0, 10)}` : '-'

  const validCategories = useMemo(
    () => new Set(VALID_CATEGORIES),
    []
  )

  const validChannels = useMemo(
    () => new Set(VALID_CHANNELS),
    []
  )

  const parseLine = useCallback(
    (line: string, headers: string[], index: number): { record: SensitiveRecord | null; flags: Partial<ParsingReport> } => {
      const flags: Partial<ParsingReport> = {}
      const vals = line.split(',')

      if (!line.trim() || vals.every((v) => !v.trim())) {
        return { record: null, flags }
      }

      const getVal = (col: string) => {
        const idx = headers.indexOf(col)
        return idx >= 0 ? vals[idx]?.trim() || '' : ''
      }

      const word = getVal('word')
      if (!word) {
        return { record: null, flags }
      }

      let category = getVal('category') as Category
      let categoryFallback = false
      if (!category || !validCategories.has(category)) {
        category = 'other'
        categoryFallback = true
      }

      let channel = getVal('channel') as Channel
      let channelFallback = false
      if (!channel || !validChannels.has(channel)) {
        channel = 'other'
        channelFallback = true
      }

      const countStr = getVal('count')
      const count = parseSafeInt(countStr, 1)
      const countFallback = countStr.trim() === '' || isNaN(parseInt(countStr, 10))

      const hitTime = getVal('hitTime') || new Date().toISOString().slice(0, 16)
      const source = getVal('source') || '未标注来源'

      if (categoryFallback) flags.categoryFallback = 1
      if (channelFallback) flags.channelFallback = 1
      if (countFallback) flags.countFallback = 1

      const record: SensitiveRecord = {
        id: `imp-${Date.now()}-${index}`,
        word,
        category,
        hitTime,
        source,
        channel,
        count,
      }

      return { record, flags }
    },
    [validCategories, validChannels]
  )

  const handleFile = useCallback(
    (file: File, mode: 'replace' | 'append') => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.trim().split('\n')

        const hasHeader = lines.length > 0 && lines[0].toLowerCase().includes('word')
        const dataLines = hasHeader ? lines.slice(1) : lines
        const headers = hasHeader ? lines[0].split(',').map((h) => h.trim()) : ['word', 'category', 'hitTime', 'source', 'channel', 'count']

        const parsed: SensitiveRecord[] = []
        const report: ParsingReport = {
          total: dataLines.length,
          valid: 0,
          skipped: 0,
          categoryFallback: 0,
          channelFallback: 0,
          countFallback: 0,
          mode,
        }

        dataLines.forEach((line, i) => {
          const { record, flags } = parseLine(line, headers, i)
          if (record) {
            parsed.push(record)
            report.valid++
            report.categoryFallback += flags.categoryFallback || 0
            report.channelFallback += flags.channelFallback || 0
            report.countFallback += flags.countFallback || 0
          } else {
            report.skipped++
          }
        })

        setReport(report)
        if (parsed.length > 0) {
          if (mode === 'replace') {
            setRecords(parsed)
          } else {
            addRecords(parsed)
          }
        }
      }
      reader.readAsText(file)
    },
    [parseLine, addRecords, setRecords]
  )

  const onReplaceDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file, 'replace')
    },
    [handleFile]
  )

  const onAppendDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setAppendDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file, 'append')
    },
    [handleFile]
  )

  const onReplaceFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file, 'replace')
      e.target.value = ''
    },
    [handleFile]
  )

  const onAppendFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file, 'append')
      e.target.value = ''
    },
    [handleFile]
  )

  const previewRecords = records.slice(0, 20)

  const showEmptyReport = report && report.valid === 0 && report.total > 0

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

      {report && (
        <div className={`card border ${showEmptyReport ? 'border-red-500/50 bg-red-500/10' : 'border-accent/30 bg-accent/5'}`}>
          <div className="flex items-start gap-3">
            {showEmptyReport ? (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="font-display font-semibold text-sm text-zinc-200 mb-1">
                {report.mode === 'replace' ? '覆盖导入' : '追加导入'} · 数据解析报告
              </h3>
              <div className="grid grid-cols-6 gap-2 text-xs">
                <div>
                  <p className="text-zinc-500">总行数</p>
                  <p className="font-mono text-zinc-200">{report.total}</p>
                </div>
                <div>
                  <p className="text-zinc-500">有效行</p>
                  <p className="font-mono text-emerald-400">{report.valid}</p>
                </div>
                <div>
                  <p className="text-zinc-500">跳过行</p>
                  <p className="font-mono text-zinc-500">{report.skipped}</p>
                </div>
                <div>
                  <p className="text-zinc-500">分类归为其他</p>
                  <p className="font-mono text-yellow-400">{report.categoryFallback}</p>
                </div>
                <div>
                  <p className="text-zinc-500">渠道归为其他</p>
                  <p className="font-mono text-yellow-400">{report.channelFallback}</p>
                </div>
                <div>
                  <p className="text-zinc-500">次数补为1</p>
                  <p className="font-mono text-yellow-400">{report.countFallback}</p>
                </div>
              </div>
              {showEmptyReport && (
                <p className="text-xs text-red-400 mt-2">
                  所有行均被跳过，请检查 CSV 是否包含 word 列，以及数据格式是否正确
                </p>
              )}
            </div>
            <button onClick={() => setReport(null)} className="text-zinc-500 hover:text-zinc-300">
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!dataLoaded ? (
        <div className="card flex flex-col items-center gap-6 py-16">
          <div
            className={`w-full max-w-lg border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-4 transition-colors ${dragOver ? 'border-accent bg-accent/10' : 'border-zinc-700'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onReplaceDrop}
          >
            <Upload className="w-10 h-10 text-zinc-500" />
            <p className="text-zinc-400">拖放 CSV 文件到此处</p>
            <label className="btn-primary cursor-pointer flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              选择文件
              <input type="file" accept=".csv" className="hidden" onChange={onReplaceFile} />
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
                      <td className="py-2 pr-4 font-medium">{r.word || '-'}</td>
                      <td className="py-2 pr-4">
                        <span className={CATEGORY_BADGE[r.category]}>
                          {CATEGORY_LABELS[r.category]}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLORS[r.channel]}`}>
                          {CHANNEL_LABELS[r.channel]}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-zinc-400 font-mono text-xs">{r.hitTime?.slice(0, 16) || '-'}</td>
                      <td className="py-2 pr-4 text-zinc-400 truncate max-w-[200px]">{r.source || '-'}</td>
                      <td className="py-2 text-right font-mono text-accent">{r.count}</td>
                    </tr>
                  ))}
                  {previewRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className={`card border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 transition-colors cursor-pointer ${dragOver ? 'border-accent bg-accent/10' : 'border-zinc-700 hover:border-zinc-600'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onReplaceDrop}
            >
              <RefreshCw className="w-6 h-6 text-zinc-500" />
              <div className="text-center">
                <p className="text-sm text-zinc-300 font-medium">覆盖导入</p>
                <p className="text-xs text-zinc-500 mt-1">用新文件替换所有数据</p>
              </div>
              <label className="text-accent text-sm cursor-pointer hover:underline mt-1">
                选择文件
                <input type="file" accept=".csv" className="hidden" onChange={onReplaceFile} />
              </label>
            </div>

            <div
              className={`card border-2 border-dashed flex flex-col items-center justify-center gap-3 py-8 transition-colors cursor-pointer ${appendDragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 hover:border-zinc-600'}`}
              onDragOver={(e) => { e.preventDefault(); setAppendDragOver(true) }}
              onDragLeave={() => setAppendDragOver(false)}
              onDrop={onAppendDrop}
            >
              <Plus className="w-6 h-6 text-zinc-500" />
              <div className="text-center">
                <p className="text-sm text-zinc-300 font-medium">追加导入</p>
                <p className="text-xs text-zinc-500 mt-1">将新文件追加到现有数据</p>
              </div>
              <label className="text-emerald-400 text-sm cursor-pointer hover:underline mt-1">
                选择文件
                <input type="file" accept=".csv" className="hidden" onChange={onAppendFile} />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
