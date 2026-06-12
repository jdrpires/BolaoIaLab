import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · Copa Tech" },
      {
        name: "description",
        content:
          "Termos de uso da Copa Tech: regras de participação, ranking, palpites, WhatsApp e uso responsável.",
      },
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <LegalPage
      eyebrow="Termos"
      title="Termos de Uso"
      description="Estes termos definem as regras básicas para participar da Copa Tech, usar o login Google, cadastrar WhatsApp, fazer palpites e aparecer nos rankings."
    >
      <LegalSection title="1. Participação">
        <p>
          A Copa Tech é um bolão corporativo e recreativo. Ao entrar, você concorda em usar a
          plataforma de forma respeitosa, informar dados verdadeiros e seguir as regras de
          participação definidas pela organização.
        </p>
      </LegalSection>

      <LegalSection title="2. Conta e autenticação">
        <p>
          O acesso é feito por login Google. Você é responsável por manter sua conta segura e por
          não compartilhar acesso com terceiros.
        </p>
        <p>
          A empresa pode ser definida automaticamente pelo domínio do e-mail ou escolhida pelo
          usuário quando necessário.
        </p>
      </LegalSection>

      <LegalSection title="3. Palpites e pontuação">
        <p>
          Palpites devem ser enviados antes do início dos jogos. Após o começo da partida, a edição
          pode ser bloqueada. A pontuação é calculada pelas regras exibidas no produto e pode ser
          recalculada pela administração em caso de correção de resultado.
        </p>
        <p>
          Em caso de inconsistência de dados esportivos, falha técnica ou atualização manual, a
          administração poderá ajustar jogos, resultados e rankings.
        </p>
      </LegalSection>

      <LegalSection title="4. Rankings">
        <p>
          Ao participar, você aceita que seu nome, empresa, pontuação e posição apareçam nos
          rankings individuais e corporativos para outros participantes autenticados.
        </p>
      </LegalSection>

      <LegalSection title="5. WhatsApp e notificações">
        <p>
          O cadastro do WhatsApp é opcional. Ao informar seu número, você autoriza o recebimento de
          mensagens relacionadas ao bolão, como lembretes, resultados e ranking. Você pode alterar
          essas preferências em <Link to="/minha-conta" className="text-primary hover:underline">Minha Conta</Link>.
        </p>
      </LegalSection>

      <LegalSection title="6. Análises de IA">
        <p>
          As análises de IA são informativas e podem errar. Elas não garantem resultados, não devem
          ser tratadas como recomendação financeira ou aposta real, e existem apenas para enriquecer
          a experiência do bolão.
        </p>
      </LegalSection>

      <LegalSection title="7. Uso adequado">
        <p>
          É proibido tentar burlar autenticação, manipular placares, explorar falhas, acessar dados
          sem permissão ou usar a plataforma para mensagens abusivas.
        </p>
      </LegalSection>

      <LegalSection title="8. Alterações">
        <p>
          A organização pode atualizar estes termos para refletir novas funcionalidades, ajustes de
          regras ou exigências operacionais. O uso contínuo da plataforma após mudanças indica
          concordância com a versão vigente.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
