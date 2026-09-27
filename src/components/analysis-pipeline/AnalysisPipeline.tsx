import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./AnalysisPipeline.css";

export type AnalysisPipelineStatus = "processing" | "completed" | "error";

interface AnalysisPipelineProps {
  fileNames: string[];
  status: AnalysisPipelineStatus;
}

type NodeState = "pending" | "active" | "complete" | "error";

const STAGE_DELAYS = [650, 1500, 2500, 3900] as const;

const stageMessages = [
  "Recebendo os documentos...",
  "Extraindo o conteúdo textual...",
  "Dividindo o texto em trechos...",
  "Calculando similaridades lexical e semântica...",
  "Combinando os sinais no motor híbrido...",
] as const;

const connections = [
  { d: "M 50 10.5 L 50 14", stage: 1 },
  { d: "M 50 22 L 50 25", stage: 2 },
  { d: "M 50 33 C 50 36, 26 36, 26 39.5", stage: 3 },
  { d: "M 50 33 C 50 36, 74 36, 74 39.5", stage: 3 },
  { d: "M 26 72 C 26 76, 50 76, 50 79", stage: 4 },
  { d: "M 74 72 C 74 76, 50 76, 50 79", stage: 4 },
  { d: "M 50 88 L 50 91", stage: 5 },
] as const;

function documentSummary(fileNames: string[]): string {
  if (fileNames.length === 0) return "Documentos do lote";
  if (fileNames.length === 1) return fileNames[0];
  return `${fileNames[0]} + ${fileNames.length - 1} ${
    fileNames.length === 2 ? "arquivo" : "arquivos"
  }`;
}

interface PipelineNodeProps {
  className?: string;
  detail: string;
  icon: ReactNode;
  label: string;
  state: NodeState;
}

function PipelineNode({
  className = "",
  detail,
  icon,
  label,
  state,
}: PipelineNodeProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`pipeline-node is-${state} ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: state === "pending" ? 0.48 : 1,
        scale:
          state === "active" && !prefersReducedMotion ? [1, 1.012, 1] : 1,
        y: 0,
      }}
      transition={
        state === "active" && !prefersReducedMotion
          ? { scale: { duration: 2.2, repeat: Infinity }, opacity: { duration: 0.25 } }
          : { duration: 0.25 }
      }
    >
      <span className="pipeline-node-icon" aria-hidden="true">
        {state === "complete" ? "✓" : icon}
      </span>
      <span className="pipeline-node-copy">
        <strong>{label}</strong>
        <small title={detail}>{detail}</small>
      </span>
    </motion.div>
  );
}

interface PipelineBranchProps {
  kind: "lexical" | "semantic";
  state: NodeState;
}

const branchSteps = {
  lexical: [
    ["Pré-processamento", "Unicode · minúsculas · pontuação · stopwords"],
    ["Vetorização TF-IDF", "importância dos termos"],
    ["Similaridade lexical", "cosseno TF-IDF + Jaccard"],
  ],
  semantic: [
    ["Texto original", "sem a limpeza do fluxo lexical"],
    ["SBERT", "preparação interna do modelo"],
    ["Embeddings", "vetores normalizados"],
    ["Similaridade semântica", "cosseno entre embeddings"],
  ],
} as const;

function PipelineBranch({ kind, state }: PipelineBranchProps) {
  const isLexical = kind === "lexical";
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className={`pipeline-branch is-${kind} is-${state}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: state === "pending" ? 0.42 : 1,
        scale:
          state === "active" && !prefersReducedMotion ? [1, 1.006, 1] : 1,
        y: 0,
      }}
      transition={
        state === "active" && !prefersReducedMotion
          ? { scale: { duration: 2.4, repeat: Infinity }, opacity: { duration: 0.25 } }
          : { duration: 0.25 }
      }
      aria-label={isLexical ? "Fluxo lexical" : "Fluxo semântico"}
    >
      <header>
        <span className="pipeline-branch-symbol" aria-hidden="true">
          {state === "complete" ? "✓" : isLexical ? "Aa" : "∿"}
        </span>
        <span>
          <small>{isLexical ? "Fluxo lexical" : "Fluxo semântico"}</small>
          <strong>{isLexical ? "TF-IDF + Jaccard" : "SBERT"}</strong>
        </span>
      </header>
      <ol>
        {branchSteps[kind].map(([label, detail], index) => (
          <motion.li
            key={label}
            animate={
              state === "active" && !prefersReducedMotion
                ? { opacity: [0.55, 1, 0.55] }
                : { opacity: state === "pending" ? 0.72 : 1 }
            }
            transition={
              state === "active" && !prefersReducedMotion
                ? { duration: 1.8, delay: index * 0.22, repeat: Infinity }
                : { duration: 0.2 }
            }
          >
            <span aria-hidden="true" />
            <div>
              <strong>{label}</strong>
              <small>{detail}</small>
            </div>
          </motion.li>
        ))}
      </ol>
    </motion.section>
  );
}

function AnalysisPipeline({ fileNames, status }: AnalysisPipelineProps) {
  const prefersReducedMotion = useReducedMotion();
  const [visualStage, setVisualStage] = useState(status === "completed" ? 5 : 0);

  useEffect(() => {
    if (status === "completed") {
      setVisualStage(5);
      return;
    }
    if (status === "error") return;

    const timers = STAGE_DELAYS.map((delay, index) =>
      window.setTimeout(() => setVisualStage(index + 1), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [status]);

  const getNodeState = (stage: number): NodeState => {
    if (status === "completed") return "complete";
    if (status === "error") {
      if (stage < visualStage) return "complete";
      return stage === visualStage ? "error" : "pending";
    }
    if (stage < visualStage) return "complete";
    return stage === visualStage ? "active" : "pending";
  };

  const statusMessage = useMemo(() => {
    if (status === "completed") return "Pipeline finalizado. Abrindo os resultados...";
    if (status === "error") return "O processamento foi interrompido.";
    return stageMessages[Math.min(visualStage, stageMessages.length - 1)];
  }, [status, visualStage]);

  const summary = documentSummary(fileNames);

  return (
    <section
      className={`analysis-pipeline is-${status}`}
      aria-labelledby="analysis-pipeline-title"
      aria-busy={status === "processing"}
    >
      <div className="analysis-pipeline-heading">
        <div>
          <span className="analysis-pipeline-kicker">Motor do Similaris</span>
          <h3 id="analysis-pipeline-title">Pipeline de análise</h3>
        </div>
        <span className="analysis-pipeline-live">
          <motion.i
            aria-hidden="true"
            animate={
              status === "processing" && !prefersReducedMotion
                ? { opacity: [0.35, 1, 0.35], scale: [0.85, 1, 0.85] }
                : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          {status === "completed"
            ? "Concluído"
            : status === "error"
              ? "Interrompido"
              : "Em processamento"}
        </span>
      </div>

      <div className="analysis-pipeline-canvas">
        <svg
          className="pipeline-connections"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {connections.map((connection) => {
            const reached = visualStage >= connection.stage || status === "completed";
            const active =
              status === "processing" && visualStage === connection.stage;

            return (
              <g key={connection.d}>
                <path className="pipeline-path-base" d={connection.d} />
                {reached && (
                  <motion.path
                    className={`pipeline-path-flow${active ? " is-active" : ""}`}
                    d={connection.d}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: status === "error" ? 0.45 : 1,
                      strokeDashoffset:
                        active && !prefersReducedMotion ? [0, -18] : 0,
                    }}
                    transition={{
                      pathLength: { duration: prefersReducedMotion ? 0 : 0.45 },
                      opacity: { duration: 0.2 },
                      strokeDashoffset: {
                        duration: 1.1,
                        ease: "linear",
                        repeat: Infinity,
                      },
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        <PipelineNode
          className="pipeline-documents"
          detail={summary}
          icon={<span className="pipeline-document-glyph">▤</span>}
          label={fileNames.length === 1 ? "Documento" : `${fileNames.length} documentos`}
          state={getNodeState(0)}
        />
        <PipelineNode
          className="pipeline-extraction"
          detail="PDF / DOCX → texto original"
          icon="T"
          label="Extração do texto"
          state={getNodeState(1)}
        />
        <PipelineNode
          className="pipeline-segmentation"
          detail="trechos com posição e offsets"
          icon="≡"
          label="Segmentação"
          state={getNodeState(2)}
        />
        <div className="pipeline-lexical">
          <PipelineBranch kind="lexical" state={getNodeState(3)} />
        </div>
        <div className="pipeline-semantic">
          <PipelineBranch kind="semantic" state={getNodeState(3)} />
        </div>
        <PipelineNode
          className="pipeline-hybrid"
          detail="sinal lexical + sinal semântico"
          icon="+"
          label="Motor híbrido"
          state={getNodeState(4)}
        />
        <PipelineNode
          className="pipeline-results"
          detail="score final e correspondências"
          icon="✓"
          label="Resultados"
          state={getNodeState(5)}
        />
      </div>

      <p className="analysis-pipeline-status" aria-live="polite">
        <span aria-hidden="true">{status === "error" ? "!" : "→"}</span>
        {statusMessage}
      </p>
    </section>
  );
}

export default AnalysisPipeline;
