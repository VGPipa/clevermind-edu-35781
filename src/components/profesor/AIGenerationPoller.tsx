import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIGenerationPollerProps {
  claseId: string;
  expectedState: string;
  onComplete: () => void;
  pollingInterval?: number;
  maxAttempts?: number;
}

export const AIGenerationPoller = ({
  claseId,
  expectedState,
  onComplete,
  pollingInterval = 3000,
  maxAttempts = 40,
}: AIGenerationPollerProps) => {
  const [attempts, setAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!isPolling || attempts >= maxAttempts) {
      return;
    }

    const interval = setInterval(async () => {
      const { data: clase, error } = await supabase
        .from('clases')
        .select('estado')
        .eq('id', claseId)
        .single();

      if (error) {
        console.error('Error polling clase state:', error);
        return;
      }

      setAttempts(prev => prev + 1);

      if (clase?.estado === expectedState) {
        setIsPolling(false);
        onComplete();
      }

      if (attempts >= maxAttempts) {
        setIsPolling(false);
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [claseId, expectedState, onComplete, pollingInterval, maxAttempts, attempts, isPolling]);

  if (!isPolling) {
    return null;
  }

  return (
    <Alert>
      <Loader2 className="h-4 w-4 animate-spin" />
      <AlertDescription className="ml-2">
        Generando con IA... Esto puede tomar entre 10-30 segundos.
      </AlertDescription>
    </Alert>
  );
};
