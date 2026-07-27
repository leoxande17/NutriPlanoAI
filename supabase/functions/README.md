# Integração Mercado Pago — deploy das Edge Functions

Este projeto usa o **Checkout Transparente via API de Orders** do Mercado Pago.
Frontend (Card Payment Brick + Pix) chama duas Edge Functions no Supabase.

## 1. Segredos necessários (nunca commitar no código)

Configure via Supabase CLI, a partir da raiz do projeto:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF

supabase secrets set MP_ACCESS_TOKEN=SEU_ACCESS_TOKEN_DE_TESTE
supabase secrets set MP_WEBHOOK_SECRET=SUA_CHAVE_SECRETA_DO_WEBHOOK
supabase secrets set ANTHROPIC_API_KEY=SUA_CHAVE_DA_API_ANTHROPIC
```

- `MP_ACCESS_TOKEN`: Access Token de teste ou produção (Suas integrações > Dados da
  integração > Credenciais).
- `MP_WEBHOOK_SECRET`: gerada ao salvar a configuração de Webhooks (Suas integrações >
  Webhooks > Configurar notificações). Sem ela, a function `mp-webhook` ainda funciona,
  mas **sem validar a assinatura** — configure assim que possível.
- `ANTHROPIC_API_KEY`: chave da API da Anthropic (console.anthropic.com), usada pela
  function `generate-meal-plan` para gerar o plano alimentar.

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas
automaticamente pelo runtime de Edge Functions, não precisam ser configuradas.

## 2. Deploy das functions

```bash
supabase functions deploy mp-create-order
supabase functions deploy mp-webhook --no-verify-jwt
supabase functions deploy generate-meal-plan
```

> `--no-verify-jwt` é necessário em `mp-webhook` porque quem chama esse endpoint é o
> Mercado Pago, não um usuário autenticado — a validação de autenticidade é feita pela
> assinatura `x-signature`, não pelo JWT do Supabase.

## 3. Configurar o Webhook no painel do Mercado Pago

1. [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) > selecione a aplicação
2. **Webhooks > Configurar notificações**
3. URL: `https://SEU_PROJECT_REF.supabase.co/functions/v1/mp-webhook`
4. Evento: **Order (Mercado Pago)**
5. Salvar — copie a chave secreta gerada e configure como `MP_WEBHOOK_SECRET` (passo 1)

## 4. Variável de frontend

No `.env` do frontend (Netlify/local), a **Public Key** (não o Access Token):

```
VITE_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 5. Testar

- Cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/resources/test-cards
- Simule o webhook em **Webhooks > Simular** antes de testar o fluxo completo.
