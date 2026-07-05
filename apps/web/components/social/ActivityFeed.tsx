'use client';

import { type SocialActivity, formatActivity, timeAgo } from '@/lib/social-data';
import { motion } from 'framer-motion';

type Props = {
  activities: SocialActivity[];
  emptyLabel?: string;
};

export function ActivityFeed({ activities, emptyLabel = 'Nenhuma atividade ainda' }: Props) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">🌎</span>
        <p className="text-muted text-sm font-medium">{emptyLabel}</p>
        <p className="text-muted/50 text-xs text-center max-w-56 leading-relaxed">
          Adicione amigos pelo código para ver o que eles estão fazendo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((act, i) => {
        const { icon, color, text, badge } = formatActivity(act);
        return (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="flex items-start gap-3 px-3 py-3 rounded-xl"
            style={{
              background: `${color}08`,
              border: `1px solid ${color}18`,
            }}
          >
            {/* Icon bubble */}
            <div
              className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <span style={{ fontSize: 16 }}>{icon}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-parchment text-[11px] leading-snug">{text}</p>
              <p className="text-muted text-[9px] mt-0.5">{timeAgo(act.createdAt)}</p>
            </div>

            {/* Badge */}
            <div
              className="shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black"
              style={{ background: `${color}20`, color, border: `1px solid ${color}35` }}
            >
              {badge}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
