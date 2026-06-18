import { NavLink, useLocation } from 'react-router-dom'
import { Upload, Tags, Clock, FileBarChart, Shield } from 'lucide-react'

const navItems = [
  { path: '/import', label: '数据导入', icon: Upload },
  { path: '/attribution', label: '词组归因', icon: Tags },
  { path: '/timeline', label: '事件时间线', icon: Clock },
  { path: '/report', label: '复盘报告', icon: FileBarChart },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-60 h-screen bg-surface-100 border-r border-zinc-800 flex flex-col fixed left-0 top-0 z-40">
      <div className="px-5 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-zinc-100 leading-tight">SentiScope</h1>
            <p className="text-[10px] text-zinc-500 tracking-wider uppercase">敏感词复盘工具</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path === '/import' && location.pathname === '/')
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
            PR
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-300">公关经理</p>
            <p className="text-[10px] text-zinc-500">品牌部</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
