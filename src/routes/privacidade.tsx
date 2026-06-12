import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade · Copa Tech" },
      {
        name: "description",
        content:
          "Política de privacidade da Copa Tech: login Google, WhatsApp, rankings, dados de empresa e análises de IA.",
      },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <LegalPage
      eyebrow="Privacidade"
      title="Política de Privacidade"
      description="Esta política explica como a Copa Tech usa dados pessoais para autenticar usuários, operar o bolão, exibir rankings, enviar avisos por WhatsApp e gerar análises de jogos."
    >
      <LegalSection title="1. Dados que coletamos">
        <p>
          Ao entrar com Google, recebemos dados básicos do perfil autorizado: nome, e-mail,
          identificador da conta Google e foto de perfil, quando disponível.
        </p>
        <p>
          Também podemos armazenar sua empresa, telefone/WhatsApp, preferências de notificação,
          palpites, pontuação, posição nos rankings e registros de notificações enviadas.
        </p>
      </LegalSection>

      <LegalSection title="2. Como usamos esses dados">
        <p>
          Usamos seus dados para criar sua conta, associar você a uma empresa, registrar palpites,
          calcular pontuação, montar rankings individuais e por empresa, enviar lembretes e manter a
          segurança da aplicação.
        </p>
        <p>
          O telefone é usado apenas para comunicações do bolão, como lembretes de palpites,
          resultados e ranking, conforme suas preferências em <Link to="/minha-conta" className="text-primary hover:underline">Minha Conta</Link>.
        </p>
      </LegalSection>

      <LegalSection title="3. Rankings e visibilidade">
        <p>
          Rankings podem exibir nome, empresa, pontos, quantidade de palpites e desempenho. Esses
          dados são parte da experiência competitiva do bolão e podem ser vistos por outros
          participantes autenticados.
        </p>
        <p>
          Rankings por empresa podem agrupar participantes por organização para comparação de
          desempenho entre times.
        </p>
      </LegalSection>

      <LegalSection title="4. Google OAuth, WhatsApp e IA">
        <p>
          O login Google é usado apenas para autenticação. Não solicitamos acesso ao Gmail, Drive,
          Calendar ou outros serviços da sua conta.
        </p>
        <p>
          Mensagens de WhatsApp podem ser processadas pelo gateway configurado para envio. As
          análises de IA podem usar dados esportivos e contexto do jogo, mas não precisam do seu
          telefone nem do seu login Google para gerar previsões.
        </p>
      </LegalSection>

      <LegalSection title="5. Compartilhamento">
        <p>
          Não vendemos dados pessoais. Podemos compartilhar dados técnicos com provedores
          necessários para operar o produto, como autenticação, hospedagem, banco de dados,
          serviços de IA, dados esportivos e envio de mensagens.
        </p>
      </LegalSection>

      <LegalSection title="6. Controle do usuário">
        <p>
          Você pode editar empresa, WhatsApp e preferências de notificação em <Link to="/minha-conta" className="text-primary hover:underline">Minha Conta</Link>.
          Para pedidos de correção, remoção ou dúvidas sobre dados, entre em contato com a equipe
          administradora do bolão.
        </p>
      </LegalSection>

      <LegalSection title="7. Segurança e retenção">
        <p>
          Mantemos controles de autenticação, permissões e registros operacionais para proteger a
          aplicação. Dados podem ser mantidos enquanto o bolão estiver ativo e pelo período
          necessário para auditoria, suporte e melhoria do produto.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
