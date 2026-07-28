/**
 * TeamWorkspacePage.jsx — Top-level product page for Terra Workspace
 *
 * Renders TeamChannel directly with no analysis gate.
 * Workspace is available as soon as a project exists.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import TeamChannel from '../../components/workspace/TeamChannel';

export default function TeamWorkspacePage() {
  const { projectId } = useParams();
  const [projectName, setProjectName] = useState('Project');

  useEffect(() => {
    if (!projectId) return;
    supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()
      .then(({ data }) => {
        if (data?.name) setProjectName(data.name);
      });
  }, [projectId]);

  return <TeamChannel projectId={projectId} projectName={projectName} />;
}
