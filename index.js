// index.js
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch'; // Se Node >= 18, pode usar fetch nativo
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from './firebaseConfig.js';  // Ajuste o caminho conforme seu projeto

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(bodyParser.json());

// Seu Access Token do Mercado Pago - use variável de ambiente no servidor real
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

app.post('/webhook', async (req, res) => {
  try {
    const topic = req.query.topic || req.query.type;

    // ✅ Verifica se a notificação recebida é de pagamento
    if (topic !== 'payment') {
      console.log('Notificação ignorada (não é pagamento):', topic);
      return res.status(200).send('Ignorado: não é pagamento.');
    }

    const notification = req.body;
    console.log('Webhook recebido:', notification);

    const paymentId = notification.data?.id;
    if (!paymentId) {
      return res.status(400).send('ID do pagamento não encontrado');
    }

    // Busca os dados atualizados do pagamento na API Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao buscar pagamento no Mercado Pago:', errorText);
      return res.status(500).send('Erro ao buscar pagamento');
    }

    const paymentData = await response.json();
    console.log('Dados do pagamento:', paymentData);

    const userId = paymentData.external_reference;
    if (!userId) {
      console.error('external_reference não encontrado no pagamento');
      return res.status(400).send('external_reference não encontrado');
    }

    // Atualiza o status do pagamento no Firestore no doc do usuário
    if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
        await updateDoc(doc(db, 'pagamentos', paymentData.id.toString()), {
          status: paymentData.status,
          updatedAt: new Date()
        });
    } else if (paymentData.status === 'approved') {
        await updateDoc(doc(db, 'pagamentos', paymentData.id.toString()), {
          status: 'approved',
          updatedAt: new Date()
        });
    } else if (paymentData.status === 'pending') {
        await updateDoc(doc(db, 'pagamentos', paymentData.id.toString()), {
          status: 'pending',
          updatedAt: new Date()
        });
    }


    console.log(`Status atualizado para o usuário ${userId}`);
    res.status(200).send('OK');

  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
});

app.listen(PORT, () => {
  console.log(`Webhook rodando na porta ${PORT}`);
});
