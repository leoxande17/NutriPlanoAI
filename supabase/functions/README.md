# Deploy das Edge Functions — passo a passo completo

Este projeto usa **Checkout Transparente via API de Orders** (Mercado Pago) +
**Claude API** (Anthropic), orquestrados por 3 Edge Functions no Supabase.
Este guia cobre desde a instalação do CLI até o teste do fluxo completo.

Projeto Supabase já criado e com as migrations aplicadas: `ntoplgykwvoszroneyku`.

---

## 0. Instalar o Supabase CLI

Escolha uma opção conforme seu sistema:

```bash
# macOS ou Linux (Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Alternativa multiplataforma (como dependência do projeto, via npm)
npm install -D supabase
# nesse caso, rode todos os comandos abaixo prefixados com "npx", ex: npx supabase login
```

Verifique a instalação:

```bash
supabase --version
```

> Rodar `supabase functions serve` localmente exige Docker Desktop (ou compatível).
> Para **fazer deploy**, Docker é opcional — o CLI cai automaticamente para deploy via
> API se não encontrar Docker (ou force com a flag `--use-api`, usada abaixo).

## 1. Login e link com o projeto

Na raiz do projeto (`nutriplano-ai/`):

```bash
supabase login
```

Isso abre o navegador para autenticar. Depois, conecte esta pasta ao projeto real:

```bash
supabase link --project-ref ntoplgykwvoszroneyku
```

Pode pedir a senha do banco — não é obrigatório informar para functions/secrets, pode
pular se só for usado para isso.

## 2. Configurar os segredos (nunca commitar no código)

```bash
supabase secrets set MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_DE_TESTE
supabase secrets set MP_WEBHOOK_SECRET=SUA_CHAVE_SECRETA_DO_WEBHOOK
supabase secrets set ANTHROPIC_API_KEY=SUA_CHAVE_DA_API_ANTHROPIC
```

- `MP_ACCESS_TOKEN`: Access Token de teste ou produção (Suas integrações > Dados da
  integração > Credenciais).
- `MP_WEBHOOK_SECRET`: só existe depois que você configurar o webhook no painel do MP
  (passo 4) — pode voltar aqui pra definir depois. Sem ela, `mp-webhook` funciona mas
  **sem validar a assinatura**.
- `ANTHROPIC_API_KEY`: chave da API da Anthropic (console.anthropic.com), usada pela
  function `generate-meal-plan`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas
automaticamente pelo runtime de Edge Functions — não precisam ser configuradas.

Confira o que já está setado a qualquer momento com:

```bash
supabase secrets list
```

## 3. Deploy das functions

```bash
supabase functions deploy mp-create-order --use-api
supabase functions deploy mp-webhook --use-api
supabase functions deploy generate-meal-plan --use-api
```

(`--use-api` evita a necessidade de Docker; pode omitir se tiver Docker rodando)

> **Sobre o JWT do `mp-webhook`**: já configurei `supabase/config.toml` com
> `verify_jwt = false` para essa function, porque quem chama esse endpoint é o
> Mercado Pago, não um usuário autenticado — a autenticidade é validada pela
> assinatura `x-signature`, não por JWT do Supabase. Isso é mais confiável que a flag
> `--no-verify-jwt` isolada (existe um bug conhecido do CLI onde a flag às vezes não
> é aplicada em redeploys). **Depois do primeiro deploy, confira no Dashboard**:
> Edge Functions > `mp-webhook` > Settings > "Enforce JWT Verification" deve estar
> **desligado**. Se estiver ligado, desligue manualmente ali.

## 4. Configurar o Webhook no painel do Mercado Pago

1. [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) > selecione a aplicação
2. **Webhooks > Configurar notificações**
3. URL: `https://ntoplgykwvoszroneyku.supabase.co/functions/v1/mp-webhook`
4. Evento: **Order (Mercado Pago)**
5. Salvar — copie a chave secreta gerada e volte ao passo 2 para configurar
   `MP_WEBHOOK_SECRET`

## 5. Variável de frontend

No `.env` do frontend (local e Netlify), a **Public Key** (não o Access Token):

```
VITE_SUPABASE_URL=https://ntoplgykwvoszroneyku.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key do projeto>
VITE_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 6. Testar o fluxo completo

1. Cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/resources/test-cards
2. No painel do Mercado Pago, use **Webhooks > Simular** para testar o `mp-webhook`
   isoladamente antes de testar o fluxo real
3. Acompanhe erros em tempo real com:
   ```bash
   supabase functions logs mp-create-order
   supabase functions logs mp-webhook
   supabase functions logs generate-meal-plan
   ```
4. Fluxo real: `npm run dev` → cadastro → anamnese → pagamento (cartão de teste ou Pix)
   → plano gerado automaticamente pela Claude API

## Checklist rápido de verificação

- [ ] `supabase secrets list` mostra os 3 segredos
- [ ] As 3 functions aparecem em Dashboard > Edge Functions como deployadas
- [ ] `mp-webhook` está com "Enforce JWT Verification" desligado
- [ ] Webhook configurado no painel do Mercado Pago, apontando pra URL certa
- [ ] `MP_WEBHOOK_SECRET` preenchida (depois do passo 4)
