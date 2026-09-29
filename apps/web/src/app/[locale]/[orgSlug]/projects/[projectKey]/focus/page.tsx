'use client';

import { useParams } from 'next/navigation';
import { ProjectFocusView } from '../../../../../../features/projects/project-focus-view';

export default function ProjectFocusPage() {
  const { orgSlug, projectKey } = useParams<{ orgSlug: string; projectKey: string }>();
  return <ProjectFocusView orgSlug={orgSlug} projectKey={projectKey} />;
}
