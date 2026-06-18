export type Category = 'abuse' | 'boycott' | 'quality' | 'fake_ad' | 'price' | 'other'
export type Channel = 'weibo' | 'douyin' | 'xiaohongshu' | 'wechat' | 'other'
export type NoteType = 'official_response' | 'media_report' | 'influencer_repost' | 'other'
export type EventType = 'spike' | 'official_response' | 'media_report' | 'influencer_repost'
export type Priority = 'high' | 'medium' | 'low'

export const CATEGORY_LABELS: Record<Category, string> = {
  abuse: '辱骂',
  boycott: '抵制',
  quality: '质量质疑',
  fake_ad: '虚假宣传',
  price: '价格争议',
  other: '其他',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  abuse: '#EF4444',
  boycott: '#8B5CF6',
  quality: '#EAB308',
  fake_ad: '#F97316',
  price: '#3B82F6',
  other: '#6B7280',
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  weibo: '微博',
  douyin: '抖音',
  xiaohongshu: '小红书',
  wechat: '微信',
  other: '其他',
}

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  official_response: '官方回应',
  media_report: '媒体报道',
  influencer_repost: '达人转发',
  other: '其他',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export interface SensitiveRecord {
  id: string
  word: string
  category: Category
  hitTime: string
  source: string
  channel: Channel
  count: number
}

export interface WordGroup {
  id: string
  mainWord: string
  category: Category
  mergedWords: string[]
  totalCount: number
}

export interface TimelineEvent {
  id: string
  timestamp: string
  type: EventType
  description: string
  spikeMagnitude: number
  notes: EventNote[]
}

export interface EventNote {
  id: string
  eventId: string
  noteType: NoteType
  content: string
  createdAt: string
}

export interface WatchItem {
  id: string
  word: string
  priority: Priority
  reason: string
}
