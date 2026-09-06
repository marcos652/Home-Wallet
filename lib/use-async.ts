"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carrega dados do Firestore no cliente. `recarregar` é o que as telas chamam
 * depois de criar/editar/excluir, no lugar do revalidatePath do servidor.
 */
export function useAsync<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>();

  // A busca é recriada a cada render; o que decide refazê-la são as deps,
  // reduzidas a uma chave para o lint conseguir verificar a lista.
  const chave = JSON.stringify(deps);
  const carregarRef = useRef(carregar);
  useEffect(() => {
    carregarRef.current = carregar;
  });

  const vivo = useRef(true);

  const buscar = useCallback(async () => {
    try {
      const resultado = await carregarRef.current();
      if (!vivo.current) return;
      setDados(resultado);
      setErro(undefined);
    } catch (e) {
      if (!vivo.current) return;
      setErro(e instanceof Error ? e.message : "Falha ao carregar");
    } finally {
      if (vivo.current) setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(() => {
    vivo.current = true;
    // A flag `vivo` descarta o resultado se a tela sair antes da resposta.
    void buscar();
    return () => {
      vivo.current = false;
    };
  }, [buscar]);

  const recarregar = useCallback(() => {
    setCarregando(true);
    return buscar();
  }, [buscar]);

  return { dados, carregando, erro, recarregar };
}
