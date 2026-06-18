import type { SensitiveRecord, TimelineEvent, WatchItem, WordGroup } from '@/types'

export const MOCK_RECORDS: SensitiveRecord[] = [
  { id: 'r001', word: '垃圾产品', category: 'abuse', hitTime: '2025-03-15T09:12:00', source: '微博评论', channel: 'weibo', count: 342 },
  { id: 'r002', word: '烂货', category: 'abuse', hitTime: '2025-03-15T10:30:00', source: '微博评论', channel: 'weibo', count: 189 },
  { id: 'r003', word: '骗人', category: 'fake_ad', hitTime: '2025-03-15T11:45:00', source: '小红书笔记', channel: 'xiaohongshu', count: 256 },
  { id: 'r004', word: '虚假宣传', category: 'fake_ad', hitTime: '2025-03-15T12:00:00', source: '抖音视频', channel: 'douyin', count: 412 },
  { id: 'r005', word: '质量太差', category: 'quality', hitTime: '2025-03-16T08:20:00', source: '微信朋友圈', channel: 'wechat', count: 178 },
  { id: 'r006', word: '用了一周就坏了', category: 'quality', hitTime: '2025-03-16T09:00:00', source: '微博评论', channel: 'weibo', count: 223 },
  { id: 'r007', word: '拒绝购买', category: 'boycott', hitTime: '2025-03-16T10:15:00', source: '小红书笔记', channel: 'xiaohongshu', count: 145 },
  { id: 'r008', word: '再也不买', category: 'boycott', hitTime: '2025-03-16T11:30:00', source: '抖音评论', channel: 'douyin', count: 198 },
  { id: 'r009', word: '太贵了', category: 'price', hitTime: '2025-03-16T13:00:00', source: '微博评论', channel: 'weibo', count: 367 },
  { id: 'r010', word: '价格离谱', category: 'price', hitTime: '2025-03-16T14:20:00', source: '微信社群', channel: 'wechat', count: 234 },
  { id: 'r011', word: '垃圾', category: 'abuse', hitTime: '2025-03-17T08:00:00', source: '微博评论', channel: 'weibo', count: 567 },
  { id: 'r012', word: '坑人', category: 'fake_ad', hitTime: '2025-03-17T09:30:00', source: '抖音评论', channel: 'douyin', count: 289 },
  { id: 'r013', word: '一星差评', category: 'quality', hitTime: '2025-03-17T10:00:00', source: '小红书笔记', channel: 'xiaohongshu', count: 156 },
  { id: 'r014', word: '抵制该品牌', category: 'boycott', hitTime: '2025-03-17T11:00:00', source: '微博评论', channel: 'weibo', count: 312 },
  { id: 'r015', word: '不值这个价', category: 'price', hitTime: '2025-03-17T12:30:00', source: '微信朋友圈', channel: 'wechat', count: 201 },
  { id: 'r016', word: '骗子品牌', category: 'fake_ad', hitTime: '2025-03-18T08:15:00', source: '微博评论', channel: 'weibo', count: 445 },
  { id: 'r017', word: '退货退款', category: 'quality', hitTime: '2025-03-18T09:45:00', source: '抖音视频', channel: 'douyin', count: 278 },
  { id: 'r018', word: '恶心', category: 'abuse', hitTime: '2025-03-18T10:30:00', source: '微博评论', channel: 'weibo', count: 334 },
  { id: 'r019', word: '拉黑', category: 'boycott', hitTime: '2025-03-18T11:15:00', source: '小红书笔记', channel: 'xiaohongshu', count: 167 },
  { id: 'r020', word: '割韭菜', category: 'price', hitTime: '2025-03-18T13:00:00', source: '微信社群', channel: 'wechat', count: 389 },
  { id: 'r021', word: '无良商家', category: 'abuse', hitTime: '2025-03-19T08:00:00', source: '微博评论', channel: 'weibo', count: 456 },
  { id: 'r022', word: '假货', category: 'fake_ad', hitTime: '2025-03-19T09:30:00', source: '抖音评论', channel: 'douyin', count: 523 },
  { id: 'r023', word: '容易坏', category: 'quality', hitTime: '2025-03-19T10:15:00', source: '小红书笔记', channel: 'xiaohongshu', count: 134 },
  { id: 'r024', word: '不买了', category: 'boycott', hitTime: '2025-03-19T11:00:00', source: '微博评论', channel: 'weibo', count: 278 },
  { id: 'r025', word: '溢价严重', category: 'price', hitTime: '2025-03-19T12:00:00', source: '微信朋友圈', channel: 'wechat', count: 245 },
  { id: 'r026', word: '垃圾品牌', category: 'abuse', hitTime: '2025-03-20T08:30:00', source: '微博评论', channel: 'weibo', count: 189 },
  { id: 'r027', word: '货不对板', category: 'fake_ad', hitTime: '2025-03-20T10:00:00', source: '抖音视频', channel: 'douyin', count: 367 },
  { id: 'r028', word: '做工粗糙', category: 'quality', hitTime: '2025-03-20T11:30:00', source: '小红书笔记', channel: 'xiaohongshu', count: 198 },
  { id: 'r029', word: '拒绝消费', category: 'boycott', hitTime: '2025-03-20T13:00:00', source: '微博评论', channel: 'weibo', count: 156 },
  { id: 'r030', word: '性价比低', category: 'price', hitTime: '2025-03-20T14:30:00', source: '微信社群', channel: 'wechat', count: 312 },
  { id: 'r031', word: '骗子公司', category: 'abuse', hitTime: '2025-03-21T09:00:00', source: '微博评论', channel: 'weibo', count: 234 },
  { id: 'r032', word: '夸大其词', category: 'fake_ad', hitTime: '2025-03-21T10:30:00', source: '抖音评论', channel: 'douyin', count: 289 },
  { id: 'r033', word: '质量堪忧', category: 'quality', hitTime: '2025-03-21T12:00:00', source: '小红书笔记', channel: 'xiaohongshu', count: 167 },
  { id: 'r034', word: '封杀', category: 'boycott', hitTime: '2025-03-21T13:30:00', source: '微博评论', channel: 'weibo', count: 445 },
  { id: 'r035', word: '智商税', category: 'price', hitTime: '2025-03-21T15:00:00', source: '微信朋友圈', channel: 'wechat', count: 378 },
]

export const MOCK_WORD_GROUPS: WordGroup[] = [
  { id: 'wg001', mainWord: '垃圾产品', category: 'abuse', mergedWords: ['垃圾产品', '垃圾', '垃圾品牌'], totalCount: 1098 },
  { id: 'wg002', mainWord: '烂货', category: 'abuse', mergedWords: ['烂货'], totalCount: 189 },
  { id: 'wg003', mainWord: '无良商家', category: 'abuse', mergedWords: ['无良商家', '骗子公司'], totalCount: 690 },
  { id: 'wg004', mainWord: '恶心', category: 'abuse', mergedWords: ['恶心'], totalCount: 334 },
  { id: 'wg005', mainWord: '虚假宣传', category: 'fake_ad', mergedWords: ['虚假宣传', '骗人', '坑人', '夸大其词'], totalCount: 1246 },
  { id: 'wg006', mainWord: '假货', category: 'fake_ad', mergedWords: ['假货', '货不对板'], totalCount: 890 },
  { id: 'wg007', mainWord: '质量太差', category: 'quality', mergedWords: ['质量太差', '用了一周就坏了', '容易坏', '做工粗糙', '质量堪忧'], totalCount: 1000 },
  { id: 'wg008', mainWord: '一星差评', category: 'quality', mergedWords: ['一星差评', '退货退款'], totalCount: 434 },
  { id: 'wg009', mainWord: '拒绝购买', category: 'boycott', mergedWords: ['拒绝购买', '再也不买', '抵制该品牌', '不买了', '拒绝消费', '拉黑', '封杀'], totalCount: 1656 },
  { id: 'wg010', mainWord: '太贵了', category: 'price', mergedWords: ['太贵了', '价格离谱', '不值这个价', '割韭菜', '溢价严重', '性价比低', '智商税'], totalCount: 2126 },
]

export const MOCK_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'te001', timestamp: '2025-03-15T09:00:00', type: 'spike',
    description: '新品发布后辱骂词激增', spikeMagnitude: 85,
    notes: [
      { id: 'n001', eventId: 'te001', noteType: 'official_response', content: '官方微博发布新品声明', createdAt: '2025-03-15T10:00:00' },
      { id: 'n002', eventId: 'te001', noteType: 'media_report', content: '36氪报道新品争议', createdAt: '2025-03-15T11:30:00' },
    ]
  },
  {
    id: 'te002', timestamp: '2025-03-16T08:00:00', type: 'spike',
    description: '质量质疑词集中爆发', spikeMagnitude: 72,
    notes: [
      { id: 'n003', eventId: 'te002', noteType: 'influencer_repost', content: '测评达人@数码老司机 发布拆机视频', createdAt: '2025-03-16T09:00:00' },
    ]
  },
  {
    id: 'te003', timestamp: '2025-03-17T08:00:00', type: 'spike',
    description: '抵制情绪扩散', spikeMagnitude: 65,
    notes: [
      { id: 'n004', eventId: 'te003', noteType: 'official_response', content: '品牌方发布致歉声明', createdAt: '2025-03-17T14:00:00' },
      { id: 'n005', eventId: 'te003', noteType: 'media_report', content: '澎湃新闻报道品牌危机', createdAt: '2025-03-17T16:00:00' },
    ]
  },
  {
    id: 'te004', timestamp: '2025-03-17T14:00:00', type: 'official_response',
    description: '品牌方发布致歉声明', spikeMagnitude: 30,
    notes: []
  },
  {
    id: 'te005', timestamp: '2025-03-18T08:00:00', type: 'spike',
    description: '虚假宣传词二次爆发', spikeMagnitude: 90,
    notes: [
      { id: 'n006', eventId: 'te005', noteType: 'influencer_repost', content: '维权博主@消费观察 转发对比图', createdAt: '2025-03-18T09:30:00' },
      { id: 'n007', eventId: 'te005', noteType: 'media_report', content: '央视财经频道报道', createdAt: '2025-03-18T20:00:00' },
    ]
  },
  {
    id: 'te006', timestamp: '2025-03-19T08:00:00', type: 'spike',
    description: '价格争议词上涨', spikeMagnitude: 58,
    notes: [
      { id: 'n008', eventId: 'te006', noteType: 'official_response', content: '宣布限时降价活动', createdAt: '2025-03-19T15:00:00' },
    ]
  },
  {
    id: 'te007', timestamp: '2025-03-19T15:00:00', type: 'official_response',
    description: '宣布限时降价活动', spikeMagnitude: 20,
    notes: []
  },
  {
    id: 'te008', timestamp: '2025-03-20T08:00:00', type: 'spike',
    description: '抵制词再次上升', spikeMagnitude: 45,
    notes: [
      { id: 'n009', eventId: 'te008', noteType: 'influencer_repost', content: '多位KOL联合发声', createdAt: '2025-03-20T10:00:00' },
    ]
  },
  {
    id: 'te009', timestamp: '2025-03-21T08:00:00', type: 'spike',
    description: '全类别词回落但仍处高位', spikeMagnitude: 40,
    notes: [
      { id: 'n010', eventId: 'te009', noteType: 'media_report', content: '经济观察报深度报道', createdAt: '2025-03-21T12:00:00' },
    ]
  },
]

export const MOCK_WATCH_ITEMS: WatchItem[] = [
  { id: 'w001', word: '虚假宣传', priority: 'high', reason: '持续高频出现，需关注法律风险' },
  { id: 'w002', word: '假货', priority: 'high', reason: '与虚假宣传关联，可能引发集体维权' },
  { id: 'w003', word: '封杀', priority: 'medium', reason: '抵制情绪仍需观察后续发展' },
  { id: 'w004', word: '智商税', priority: 'medium', reason: '价格争议可能因降价活动缓和' },
  { id: 'w005', word: '退货退款', priority: 'low', reason: '售后处理效率已改善' },
]
