'use client';

import { Link } from 'react-router-dom';
import { BarChart3, BotMessageSquare, GitMerge, Scissors, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const isActivePath = (pathname: string, target: string) => {
  if (target === '/') return pathname === '/';
  return pathname.startsWith(target);
};

export function AppNav({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-2 md:flex">
      <Button asChild variant={isActivePath(pathname, '/') ? 'secondary' : 'ghost'} size="icon" aria-label="Go to Generate" title="Generate">
        <Link to="/" aria-current={isActivePath(pathname, '/') ? 'page' : undefined}>
          <BotMessageSquare className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant={isActivePath(pathname, '/single') ? 'secondary' : 'ghost'} size="icon" aria-label="Go to Single Student" title="Single Student">
        <Link to="/single" aria-current={isActivePath(pathname, '/single') ? 'page' : undefined}>
          <User className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant={isActivePath(pathname, '/trim') ? 'secondary' : 'ghost'} size="icon" aria-label="Go to Trim" title="Trim">
        <Link to="/trim" aria-current={isActivePath(pathname, '/trim') ? 'page' : undefined}>
          <Scissors className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant={isActivePath(pathname, '/merge') ? 'secondary' : 'ghost'} size="icon" aria-label="Go to Merge" title="Merge">
        <Link to="/merge" aria-current={isActivePath(pathname, '/merge') ? 'page' : undefined}>
          <GitMerge className="h-4 w-4" />
        </Link>
      </Button>
      <Button asChild variant={isActivePath(pathname, '/analysis') ? 'secondary' : 'ghost'} size="icon" aria-label="Go to Analysis" title="Analysis">
        <Link to="/analysis" aria-current={isActivePath(pathname, '/analysis') ? 'page' : undefined}>
          <BarChart3 className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
