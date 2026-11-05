import React, { useState } from 'react';
import { Home, MessageSquare, Mic, CheckSquare, Calendar, Database, Wrench, Bell, Settings, Youtube, PanelLeftClose, PanelLeftOpen, Box, Sparkles, Users } from 'lucide-react';
import { NavigationPageId } from '../../types/index.ts';

interface Props { activePage: NavigationPageId; onNavigate: (page: NavigationPageId) => void; unreadCount?: number }
const groups = [
  { label: 'Workspace', items: [{ id: 'command_center', label: 'Overview', icon: Home }, { id: 'chat', label: 'Conversations', icon: MessageSquare }, { id: 'voice', label: 'Voice studio', icon: Mic }] },
  { label: 'Your everyday', items: [{ id: 'tasks', label: 'Tasks', icon: CheckSquare }, { id: 'calendar', label: 'Reminders', icon: Calendar }, { id: 'memory', label: 'Memory', icon: Database }, { id: 'people', label: 'People memory', icon: Users }] },
  { label: 'Explore', items: [{ id: 'youtube_media', label: 'YouTube', icon: Youtube }, { id: 'glb_studio', label: '3D studio', icon: Box }, { id: 'tools', label: 'Tools', icon: Wrench }, { id: 'notifications', label: 'Notifications', icon: Bell }, { id: 'settings', label: 'Settings', icon: Settings }] },
];
export const JarvisLeftNav: React.FC<Props> = ({ activePage, onNavigate, unreadCount = 0 }) => {
  const [collapsed, setCollapsed] = useState(true);
  return <aside className={`workspace-nav ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="nav-workspace"><span className="workspace-monogram"><Sparkles size={18} /></span><div><strong>Personal workspace</strong><span>Make room for what matters</span></div></div>
    <nav aria-label="Main navigation">{groups.map(group => <div className="nav-group" key={group.label}><p>{group.label}</p>{group.items.map(({ id, label, icon: Icon }) =>
      <button type="button" key={id} onClick={() => onNavigate(id as NavigationPageId)} aria-label={label} aria-current={activePage === id ? 'page' : undefined} title={label} className={activePage === id ? 'active' : ''}><Icon size={18} /><span>{label}</span>{id === 'notifications' && unreadCount > 0 && <small>{unreadCount}</small>}</button>
    )}</div>)}</nav>
    <button type="button" className="nav-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}<span>Collapse sidebar</span></button>
  </aside>;
};
