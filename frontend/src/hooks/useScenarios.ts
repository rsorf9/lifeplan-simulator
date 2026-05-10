import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Scenario, SliderInputs } from '../lib/types';

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    if (error) setError(error.message);
    else setScenarios((data ?? []) as Scenario[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(
    async (name: string, inputs: SliderInputs) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('未ログインです');
      const { data, error } = await supabase
        .from('scenarios')
        .insert({ name, inputs, user_id: auth.user.id })
        .select()
        .single();
      if (error) throw error;
      await reload();
      return data as Scenario;
    },
    [reload]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Scenario>) => {
      const { error } = await supabase.from('scenarios').update(patch).eq('id', id);
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('scenarios').delete().eq('id', id);
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  const duplicate = useCallback(
    async (src: Scenario) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('未ログインです');
      const { error } = await supabase.from('scenarios').insert({
        name: `${src.name}（コピー）`,
        inputs: src.inputs,
        extra_settings: src.extra_settings,
        parent_scenario_id: src.id,
        user_id: auth.user.id,
      });
      if (error) throw error;
      await reload();
    },
    [reload]
  );

  return { scenarios, loading, error, reload, create, update, remove, duplicate };
}
