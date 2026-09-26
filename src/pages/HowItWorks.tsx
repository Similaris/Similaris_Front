import "./HowItWorks.css";

interface HowItWorksProps {
  onStartAnalysis: () => void;
}

interface PipelineStep {
  number: string;
  title: string;
  description: string;
  detail: string;
  tone: string;
}

const pipelineSteps: PipelineStep[] = [
  {
    number: "01",
    title: "Upload",
    description: "Você envia um ou mais arquivos para análise.",
    detail: "PDF e DOCX · até 20 MB por arquivo",
    tone: "navy",
  },
  {
    number: "02",
    title: "Extração",
    description: "O conteúdo textual é extraído preservando a ordem do documento.",
    detail: "Texto original · posições · offsets",
    tone: "blue",
  },
  {
    number: "03",
    title: "Segmentação",
    description: "O texto é dividido em trechos menores para permitir uma comparação precisa.",
    detail: "Cada trecho recebe um identificador",
    tone: "cyan",
  },
  {
    number: "04",
    title: "Processamento lexical",
    description: "O sistema compara as palavras e a sobreposição entre os trechos.",
    detail: "TF-IDF + Jaccard",
    tone: "amber",
  },
  {
    number: "05",
    title: "Processamento semântico",
    description: "Cada trecho é representado por um embedding para capturar significado, mesmo com palavras diferentes.",
    detail: "SBERT · similaridade semântica",
    tone: "orange",
  },
  {
    number: "06",
    title: "Comparação com a PAN-PC-11",
    description: "Os candidatos encontrados são comparados com os documentos do corpus de referência.",
    detail: "Busca lexical e semântica no corpus",
    tone: "green",
  },
  {
    number: "07",
    title: "Motor híbrido",
    description: "Os sinais lexical e semântico são combinados em um score final por correspondência.",
    detail: "Uma visão mais equilibrada do resultado",
    tone: "teal",
  },
  {
    number: "08",
    title: "Classificação e relatório",
    description: "O resultado recebe uma faixa de similaridade e aparece com a comparação dos textos.",
    detail: "Baixa · moderada · alta · muito alta",
    tone: "pink",
  },
];

function HowItWorks({ onStartAnalysis }: HowItWorksProps) {
  return (
    <main className="page how-it-works-page">
      <section className="how-hero">
        <div className="how-hero-copy">
          <span className="how-eyebrow">Transparência do método</span>
          <h1>Como funciona a detecção de similaridade</h1>
          <p>
            O Similaris combina sinais de texto e de significado para encontrar
            possíveis correspondências. O resultado é um apoio à análise humana,
            com contexto suficiente para investigar cada trecho.
          </p>
          <button className="button-primary" type="button" onClick={onStartAnalysis}>
            Enviar documentos
          </button>
        </div>
        <div className="how-hero-visual" aria-hidden="true">
          <div className="how-visual-orbit orbit-one" />
          <div className="how-visual-orbit orbit-two" />
          <div className="how-visual-core">S</div>
          <span className="how-visual-label label-upload">PDF / DOCX</span>
          <span className="how-visual-label label-score">score final</span>
          <span className="how-visual-label label-corpus">PAN-PC-11</span>
        </div>
      </section>

      <section className="how-section" aria-labelledby="pipeline-title">
        <div className="how-section-heading">
          <span className="how-section-kicker">Do arquivo ao resultado</span>
          <h2 id="pipeline-title">O pipeline em oito etapas</h2>
          <p>
            Cada fase prepara dados para a próxima e mantém a origem do trecho
            visível até o relatório final.
          </p>
        </div>

        <ol className="how-pipeline">
          {pipelineSteps.map((step, index) => (
            <li key={step.number} className={`how-pipeline-step tone-${step.tone}`}>
              <div className="how-step-marker">
                <span>{step.number}</span>
              </div>
              <div className="how-step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="how-step-detail">{step.detail}</span>
              </div>
              {index < pipelineSteps.length - 1 && (
                <span className="how-step-connector" aria-hidden="true">
                  ↓
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="how-method-grid" aria-label="Métodos de comparação">
        <article className="how-method-card">
          <span className="how-method-icon is-lexical">Aa</span>
          <div>
            <span className="how-method-label">Método lexical</span>
            <h2>Quando as palavras se repetem</h2>
            <p>
              TF-IDF mede a importância dos termos e Jaccard mede a sobreposição
              dos conjuntos de palavras. Juntos, eles identificam coincidências
              diretas e padrões de vocabulário.
            </p>
          </div>
        </article>

        <article className="how-method-card">
          <span className="how-method-icon is-semantic">∿</span>
          <div>
            <span className="how-method-label">Método semântico</span>
            <h2>Quando o sentido permanece</h2>
            <p>
              O SBERT transforma cada trecho em uma representação vetorial e
              aproxima textos que expressam ideias semelhantes, mesmo quando a
              redação foi alterada.
            </p>
          </div>
        </article>

        <article className="how-method-card">
          <span className="how-method-icon is-hybrid">+</span>
          <div>
            <span className="how-method-label">Motor híbrido</span>
            <h2>Uma decisão com mais contexto</h2>
            <p>
              Os sinais de cada método são combinados em um score final. Assim,
              o sistema não depende de uma única medida para ordenar as
              correspondências encontradas.
            </p>
          </div>
        </article>
      </section>

      <section className="how-report-card" aria-labelledby="report-title">
        <div>
          <span className="how-section-kicker">Leitura do resultado</span>
          <h2 id="report-title">O que aparece no relatório?</h2>
          <p>
            Cada correspondência mostra o trecho analisado, a fonte encontrada,
            os indicadores de cada método e o score final. Use esses dados para
            priorizar a revisão dos casos mais relevantes.
          </p>
        </div>
        <div className="how-classifications" aria-label="Faixas de classificação">
          <div className="how-classification is-low">
            <span />
            <strong>Baixa</strong>
            <small>Poucos sinais em comum</small>
          </div>
          <div className="how-classification is-moderate">
            <span />
            <strong>Moderada</strong>
            <small>Vale uma revisão</small>
          </div>
          <div className="how-classification is-high">
            <span />
            <strong>Alta</strong>
            <small>Correspondência relevante</small>
          </div>
          <div className="how-classification is-very-high">
            <span />
            <strong>Muito alta</strong>
            <small>Prioridade de investigação</small>
          </div>
        </div>
      </section>

      <aside className="how-disclaimer">
        <strong>Importante: o resultado apoia a análise humana</strong>
        <p>
          Similaridade textual é um indicador, não uma conclusão automática de
          plágio. Contexto, citações, autoria e finalidade do texto precisam ser
          avaliados por uma pessoa.
        </p>
      </aside>
    </main>
  );
}

export default HowItWorks;
