import {
  addMonthsClamped,
  cleanPayeeName,
  getDate,
  getPayeeName,
  getTransactionDateCorrected,
  installmentSeriesKey,
  isDocumentNumber,
  selfDatedInstallmentSeries,
} from '#app-pluggyai/util';

describe('pluggyai util', () => {
  describe('#getDate', () => {
    it('reads the calendar day in the given time zone', () => {
      // 22:07 in Brasília on the 22nd is already the 23rd in UTC.
      expect(getDate('2026-10-23T01:07:33.032Z', 'America/Sao_Paulo')).toBe(
        '2026-10-22',
      );
      expect(getDate('2026-10-23T01:07:33.032Z', 'UTC')).toBe('2026-10-23');
    });

    it('keeps local-midnight card entries on their day', () => {
      expect(getDate('2026-09-10T03:00:00.000Z', 'America/Sao_Paulo')).toBe(
        '2026-09-10',
      );
    });

    it('accepts Date instances and defaults to UTC', () => {
      expect(getDate(new Date('2026-01-31T12:00:00Z'))).toBe('2026-01-31');
    });
  });

  describe('#addMonthsClamped', () => {
    it('clamps to the last day of the target month', () => {
      expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
      expect(addMonthsClamped('2026-07-31', 1)).toBe('2026-08-31');
    });

    it('adds zero months unchanged', () => {
      expect(addMonthsClamped('2026-10-03', 0)).toBe('2026-10-03');
    });
  });

  describe('#getTransactionDateCorrected', () => {
    const tz = 'America/Sao_Paulo';

    it('keeps the posting day when there is no installment', () => {
      expect(
        getTransactionDateCorrected(
          { date: '2026-09-22T03:00:00.000Z', creditCardMetadata: {} },
          tz,
        ),
      ).toBe('2026-09-22');
    });

    it('moves installment k to k−1 months after the purchase', () => {
      // 11/12 of a purchase on 2025-11-04, posted on the 2026-08-31 statement.
      expect(
        getTransactionDateCorrected(
          {
            date: '2026-08-31T03:00:00.000Z',
            creditCardMetadata: {
              purchaseDate: '2025-11-04T00:38:27.000Z',
              installmentNumber: 11,
              totalInstallments: 12,
              billForecastDate: '2026-10',
            },
          },
          tz,
        ),
      ).toBe('2026-09-03');
    });

    it('keeps the shift when the bank posts every installment early', () => {
      // Nubank posts 2/3 five days after the purchase, filed under the bill
      // two months later; the installment still belongs to the next month.
      expect(
        getTransactionDateCorrected(
          {
            date: '2026-07-26T03:00:00.000Z',
            creditCardMetadata: {
              purchaseDate: '2026-07-21T07:24:45.001Z',
              installmentNumber: 2,
              totalInstallments: 3,
              billForecastDate: '2026-09',
            },
          },
          tz,
        ),
      ).toBe('2026-08-21');
    });

    it('shifts as before when the bank names no bill', () => {
      expect(
        getTransactionDateCorrected(
          {
            date: '2026-07-26T03:00:00.000Z',
            creditCardMetadata: {
              purchaseDate: '2026-07-21T07:24:45.001Z',
              installmentNumber: 2,
              totalInstallments: 3,
            },
          },
          tz,
        ),
      ).toBe('2026-08-21');
    });

    it('keeps the first installment on the purchase day', () => {
      expect(
        getTransactionDateCorrected(
          {
            date: '2026-10-03T19:59:00.000Z',
            creditCardMetadata: {
              purchaseDate: '2026-10-03T19:59:00.000Z',
              installmentNumber: 1,
              totalInstallments: 2,
            },
          },
          tz,
        ),
      ).toBe('2026-10-03');
    });

    it('does not shift a lone installment the bill shows is self-dated', () => {
      // A yearly fee charged in twelve parts: each part has its own
      // purchaseDate one day before posting. Shifting 6/12 would land it on
      // 2027-02-09, four months past the bill it is filed under.
      expect(
        getTransactionDateCorrected(
          {
            date: '2026-09-10T03:00:00.000Z',
            creditCardMetadata: {
              purchaseDate: '2026-09-09T03:00:00.000Z',
              installmentNumber: 6,
              totalInstallments: 12,
              billForecastDate: '2026-10',
            },
          },
          tz,
        ),
      ).toBe('2026-09-09');
    });

    it('keeps every part of a series the batch proves self-dated', () => {
      const fee = (k, day) => ({
        description: `ANUIDADE DIFERENC ${String(k).padStart(2, '0')}/12`,
        amount: 56.5,
        date: `${day}T03:00:00.000Z`,
        creditCardMetadata: {
          cardNumber: '7937',
          purchaseDate: `${day}T03:00:00.000Z`,
          billPostDate: day,
          installmentNumber: k,
          totalInstallments: 12,
          billForecastDate: `${day.slice(0, 7)}`,
        },
      });
      const batch = [
        fee(2, '2026-05-07'),
        fee(3, '2026-06-09'),
        fee(4, '2026-07-07'),
      ];
      const selfDated = selfDatedInstallmentSeries(batch, tz);
      expect(selfDated.has(installmentSeriesKey(batch[0]))).toBe(true);
      // 2/12 alone would pass the bill test after a shift; the series says no.
      expect(getTransactionDateCorrected(batch[0], tz, selfDated)).toBe(
        '2026-05-07',
      );
      expect(getTransactionDateCorrected(batch[2], tz, selfDated)).toBe(
        '2026-07-07',
      );
    });

    it('does not call an ordinary series self-dated', () => {
      const part = (k, day, bill, purchase = '2026-07-21T07:24:45.001Z') => ({
        description: `Nuv*Casadosperfum ${k}/3`,
        amount: 88.38,
        date: `${day}T03:00:00.000Z`,
        creditCardMetadata: {
          cardNumber: '8181',
          purchaseDate: purchase,
          billPostDate: day,
          installmentNumber: k,
          totalInstallments: 3,
          billForecastDate: bill,
        },
      });
      const batch = [
        part(1, '2026-07-21', '2026-08'),
        part(2, '2026-07-26', '2026-09'),
        part(3, '2026-08-26', '2026-10'),
      ];
      expect(selfDatedInstallmentSeries(batch, tz).size).toBe(0);
      expect(
        batch.map(t => getTransactionDateCorrected(t, tz, new Set())),
      ).toEqual(['2026-07-21', '2026-08-21', '2026-09-21']);

      // Two purchases at the same shop, same amount and plan, two months
      // apart: their purchase dates differ, but the later parts post months
      // after them, so the merged key is still an ordinary series.
      const second = '2026-09-21T10:00:00.000Z';
      const merged = [
        ...batch,
        part(1, '2026-09-21', '2026-10', second),
        part(2, '2026-09-26', '2026-11', second),
      ];
      const selfDated = selfDatedInstallmentSeries(merged, tz);
      expect(selfDated.size).toBe(0);
      expect(getTransactionDateCorrected(merged[4], tz, selfDated)).toBe(
        '2026-10-21',
      );
    });

    it('keys a series by card as well, so two cards never merge', () => {
      const a = {
        description: 'LOJA 01/02',
        amount: 10,
        creditCardMetadata: { cardNumber: '1111', totalInstallments: 2 },
      };
      const b = {
        ...a,
        creditCardMetadata: { ...a.creditCardMetadata, cardNumber: '2222' },
      };
      expect(installmentSeriesKey(a)).not.toBe(installmentSeriesKey(b));
    });

    it('falls back to the entry date when purchaseDate is missing', () => {
      expect(
        getTransactionDateCorrected(
          {
            date: '2026-08-31T03:00:00.000Z',
            creditCardMetadata: { installmentNumber: 3, totalInstallments: 3 },
          },
          tz,
        ),
      ).toBe('2026-08-31');
    });
  });

  describe('#isDocumentNumber', () => {
    it('recognises plain, formatted and masked CPF/CNPJ', () => {
      expect(isDocumentNumber('12345678901')).toBe(true);
      expect(isDocumentNumber('123.456.789-01')).toBe(true);
      expect(isDocumentNumber('***.456.789-**')).toBe(true);
      expect(isDocumentNumber('00.394.429/0198-04')).toBe(true);
    });

    it('rejects names and empty values', () => {
      expect(isDocumentNumber('Maria 2 Irmãos')).toBe(false);
      expect(isDocumentNumber('')).toBe(false);
      expect(isDocumentNumber(null)).toBe(false);
    });
  });

  describe('#cleanPayeeName', () => {
    it('drops the operation label in front of the counterparty', () => {
      expect(cleanPayeeName('Pix enviado Beltrana Souza')).toBe(
        'Beltrana Souza',
      );
      expect(cleanPayeeName('Pagamento de Pix QR Code DANIELE SILVA')).toBe(
        'DANIELE SILVA',
      );
      expect(cleanPayeeName('Compra débito Galo Barbearia')).toBe(
        'Galo Barbearia',
      );
      expect(cleanPayeeName('Pagamento de seguro Seguro Cartao 0000')).toBe(
        'Seguro Cartao 0000',
      );
      expect(cleanPayeeName('TED recebida EMPRESA LTDA')).toBe('EMPRESA LTDA');
      expect(cleanPayeeName('Transferência enviada pelo Pix - Fulano')).toBe(
        'Fulano',
      );
    });

    it('keeps the description when nothing follows the label', () => {
      expect(cleanPayeeName('Pix recebido')).toBe('Pix recebido');
      expect(cleanPayeeName('Pix recebido Pix recebido')).toBe('Pix recebido');
      expect(cleanPayeeName('Pagamento de fatura')).toBe('Pagamento de fatura');
    });

    it('reads the counterparty after the bar and before its institution', () => {
      expect(
        cleanPayeeName(
          'Transferência enviada pelo Pix|Fulano de Tal - Banco X (0260) Agência: 1 Conta: 2-3',
        ),
      ).toBe('Fulano de Tal');
      expect(cleanPayeeName('Transferência Recebida|Maria Souza')).toBe(
        'Maria Souza',
      );
      expect(cleanPayeeName('Compra no débito|Padaria Pão')).toBe(
        'Padaria Pão',
      );
      expect(
        cleanPayeeName('Estorno - Transferência enviada pelo Pix|Loja Ltda.'),
      ).toBe('Loja Ltda.');
      expect(cleanPayeeName('Compra no débito Padaria')).toBe('Padaria');
    });

    it('drops the installment counter at the end', () => {
      expect(cleanPayeeName('CENTAURO CE85     02/02')).toBe('CENTAURO CE85');
      expect(cleanPayeeName('ANUIDADE DIFERENC 07/12')).toBe(
        'ANUIDADE DIFERENC',
      );
      expect(cleanPayeeName('J B M A MULTIMARCA01/02')).toBe(
        'J B M A MULTIMARCA',
      );
      expect(cleanPayeeName('02/12')).toBe('02/12');
      expect(cleanPayeeName('LOJA 1234/56')).toBe('LOJA 1234/56');
    });

    it('leaves other descriptions untouched apart from whitespace', () => {
      expect(cleanPayeeName('  Rendimentos   REND PAGO ')).toBe(
        'Rendimentos REND PAGO',
      );
      expect(cleanPayeeName(null)).toBe('');
    });
  });

  describe('#getPayeeName', () => {
    const cpf = { type: 'CPF', value: '123.456.789-01' };

    it('prefers what the statement prints over the merchant record', () => {
      expect(
        getPayeeName({
          type: 'DEBIT',
          description: 'CENTAURO CE85     02/02',
          merchant: { businessName: 'SBF COMERCIO DE PRODUTOS ESPORTIVOS' },
        }),
      ).toBe('CENTAURO CE85');
      expect(
        getPayeeName({
          type: 'DEBIT',
          description: '',
          merchant: { name: 'Apple', businessName: 'APPLE COMPUTER BRASIL' },
        }),
      ).toBe('Apple');
      expect(
        getPayeeName({
          type: 'DEBIT',
          description: 'Pagamento de boleto BANCO BRADESCO S.A.',
          merchant: { businessName: 'BANCO BRADESCO S.A.' },
        }),
      ).toBe('BANCO BRADESCO S.A.');
    });

    it('uses the named counterparty of a transfer', () => {
      expect(
        getPayeeName({
          type: 'DEBIT',
          description: 'Pagamento de Pix QR Code Fulano de Tal',
          paymentData: {
            receiver: { name: 'Fulano de Tal', documentNumber: cpf },
            payer: { name: null, documentNumber: cpf },
          },
        }),
      ).toBe('Fulano de Tal');
      expect(
        getPayeeName({
          type: 'CREDIT',
          description: 'TED recebida UNIDADE',
          paymentData: {
            payer: { name: 'ORGANIZACAO EXEMPLO', documentNumber: cpf },
          },
        }),
      ).toBe('ORGANIZACAO EXEMPLO');
    });

    it('never uses a document number as the payee', () => {
      expect(
        getPayeeName({
          type: 'DEBIT',
          description: 'Pix enviado Beltrana Souza',
          paymentData: {
            receiver: { name: null, documentNumber: cpf },
            payer: { name: null, documentNumber: cpf },
          },
        }),
      ).toBe('Beltrana Souza');
      expect(
        getPayeeName({
          type: 'DEBIT',
          description: '123.456.789-01',
          paymentData: {
            receiver: { name: '123.456.789-01', documentNumber: cpf },
          },
        }),
      ).toBe('');
    });

    it('falls back to the description for other entries', () => {
      expect(
        getPayeeName({
          type: 'CREDIT',
          description: 'Rendimentos REND PAGO APLIC AUT MAIS',
          paymentData: { payer: null, receiver: { documentNumber: cpf } },
        }),
      ).toBe('Rendimentos REND PAGO APLIC AUT MAIS');
      expect(getPayeeName({ type: 'DEBIT', description: null })).toBe('');
    });
  });
});
