import React, { useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';

interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client?: {
    id?: number;
    address?: string;
    phone?: string;
  };
  billing_year?: number;
  billing_month?: number;
  subtotal: number;
  tax_amount: number;
  tax_percentage: number;
  discount_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  description?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  lineItems: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

export default function PrintInvoice({ invoice }: { invoice: Invoice }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  const accountNumber = useMemo(() => {
    if (!invoice.client) return 'N/A';
    const prefix = invoice.client_name.substring(0, 3).toUpperCase();
    const id = String((invoice.client?.id || invoice.id || 0)).padStart(2, '0');
    return `2025/${prefix}/${id}`;
  }, [invoice.client, invoice.client_name]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatNumber = (num: number) => {
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const emptyRows = useMemo(() => {
    const count = Math.max(0, 10 - invoice.lineItems.length);
    return Array.from({ length: count }, (_, i) => i);
  }, [invoice.lineItems.length]);

  return (
    <div className="min-h-screen bg-white text-black print:bg-white print:text-black" style={{ fontFamily: "'Gill Sans MT', Calibri, Arial, sans-serif" }}>
      <Head title={`Print Invoice ${invoice.invoice_number}`} />

      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Invoice {invoice.invoice_number}</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-medium">Print</button>
            <button onClick={() => history.back()} className="px-3 py-1.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-medium">Back</button>
          </div>
        </div>
      </div>

      {/* Invoice Content - 8-column table layout matching Zingani template */}
      <main className="p-6 print:p-0" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <colgroup>
            <col style={{ width: '2%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '1%' }} />
            <col style={{ width: '1%' }} />
          </colgroup>
          <tbody>
            {/* Row 0: Company Name + Logo area */}
            <tr>
              <td>&nbsp;</td>
              <td colSpan={2} style={{ fontFamily: "'Bookman Old Style', Georgia, serif", fontSize: '20pt', fontWeight: 'bold', color: '#FF0000', verticalAlign: 'middle' }}>
                COIN SECURITY SERVICES
              </td>
              <td style={{ fontFamily: "'Gill Sans MT', Calibri, sans-serif", fontSize: '16pt', fontWeight: 'bold', verticalAlign: 'middle' }}>
              </td>
              <td colSpan={4} style={{ position: 'relative' }}>
                <img src="/images/Coin-logo.png" alt="Coin Security Logo" style={{ width: '140px', height: 'auto', marginLeft: 'auto', display: 'block' }} />
              </td>
            </tr>
            {/* Row 1: Tagline */}
            <tr>
              <td>&nbsp;</td>
              <td colSpan={3} style={{ fontFamily: "'Brush Script MT', cursive", fontSize: '16pt', fontWeight: 'bold', color: '#FF0000', textAlign: 'center', verticalAlign: 'middle' }}>
                Prevent | Respond | Protect
              </td>
              <td colSpan={4}></td>
            </tr>
            {/* Row 2: Address + Phone */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', paddingLeft: '9px' }}>P.O. Box 30450</td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Phone:</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>(265) 0999 611 711</td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 3: Address + Head Office */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', paddingLeft: '9px' }}>Area 47 Sector 4, Viphya Street</td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Head Office:</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>(265) 0999 611 712</td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 4: City + Off Hours */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', paddingLeft: '9px' }}>Lilongwe</td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Off Hours:</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>(265) 0999 958 589</td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 5: Empty + Email */}
            <tr>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>E-mail:</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', textDecoration: 'underline', color: '#A599AE' }}>coinsec9@gmail.com</td>
              <td></td>
              <td></td>
            </tr>
            {/* Row 6: Empty row */}
            <tr>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 7: INVOICE label + Invoice Number */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '14pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696' }}>INVOICE</td>
              <td colSpan={2} style={{ fontFamily: "'Arial Rounded MT Bold', Arial, sans-serif", fontSize: '16pt', fontWeight: 'bold' }}>
                {invoice.invoice_number}
              </td>
              <td></td>
              <td></td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 8: Empty row */}
            <tr>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 9: Account # + Bill To */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Account #:</td>
              <td style={{ fontFamily: "'Arial Rounded MT Bold', Arial, sans-serif", fontSize: '12pt', fontWeight: 'bold' }}>{accountNumber}</td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Bill To:</td>
              <td style={{ fontFamily: "'Calibri', Arial, sans-serif", fontSize: '12pt', fontWeight: 'bold' }}>{invoice.client_name}</td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 10: Date + Client Address */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Date:</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>{formatDate(invoice.invoice_date)}</td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold' }}>{invoice.client?.address || 'Residence'}</td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 11: Customer ID + Client Phone/City */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', color: '#969696', textAlign: 'right', paddingRight: '8px' }}>Customer ID:</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>{invoice.client?.id || ''}</td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold' }}>{invoice.client?.phone || 'Lilongwe'}</td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Row 12-14: Empty rows */}
            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td>&nbsp;</td><td></td></tr>
            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td>&nbsp;</td><td></td></tr>
            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td>&nbsp;</td><td></td></tr>
            {/* Row 15: Column Headers */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>Qty</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>Type</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>Description</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>Unit</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>Amount</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>

            {/* Line Items */}
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td>&nbsp;</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>{item.quantity}</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>Standard Security Guard</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>{item.description}</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', textAlign: 'right' }}>&nbsp;&nbsp;{formatNumber(item.unit_price)}</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', textAlign: 'right' }}>&nbsp;&nbsp;{formatNumber(item.line_total)}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
            {/* Empty Rows */}
            {emptyRows.map((i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>&nbsp;</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}></td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}></td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}></td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', textAlign: 'right' }}>0</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
            {/* Spacer rows */}
            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td style={{ textAlign: 'right' }}>0</td><td>&nbsp;</td><td>&nbsp;</td></tr>
            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td style={{ textAlign: 'right' }}>0</td><td>&nbsp;</td><td>&nbsp;</td></tr>
            {/* SubTotal */}
            <tr>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontStyle: 'italic', backgroundColor: '#D8E2EA', border: '1px solid #C6D1D4', textAlign: 'center' }}>SubTotal</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', backgroundColor: '#D8E2EA', border: '1px solid #C6D1D4', textAlign: 'right', paddingRight: '8px' }}>&nbsp;&nbsp;{formatNumber(invoice.subtotal)}</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Credit Note row (if applicable) */}
            {invoice.discount_amount > 0 && (
              <tr>
                <td>&nbsp;</td>
                <td></td>
                <td></td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontStyle: 'italic', backgroundColor: '#D8E2EA', textAlign: 'center' }}>Credit Note</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontStyle: 'italic', backgroundColor: '#D8E2EA', textAlign: 'right', paddingRight: '8px', borderRight: '1px solid #C6D1D4' }}>&nbsp;&nbsp;{formatNumber(invoice.discount_amount)}</td>
                <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', backgroundColor: '#D8E2EA', textAlign: 'right' }}>0</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            )}
            {/* Public Holidays row (placeholder) */}
            <tr>
              <td>&nbsp;</td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', backgroundColor: '#D8E2EA' }}>Public Holidays</td>
              <td style={{ backgroundColor: '#D8E2EA', borderTop: '1px solid #C6D1D4', borderBottom: '1px solid #C6D1D4', borderLeft: 'none', borderRight: '1px solid #C6D1D4' }}></td>
              <td style={{ backgroundColor: '#D8E2EA', border: '1px solid #C6D1D4' }}></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', backgroundColor: '#D8E2EA', textAlign: 'right' }}>0</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* TOTAL */}
            <tr>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', backgroundColor: '#EBF0F4', border: '1px solid #C6D1D4', textAlign: 'right', paddingRight: '8px' }}>TOTAL</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', backgroundColor: '#EBF0F4', border: '1px solid #C6D1D4', textAlign: 'right', paddingRight: '8px' }}>&nbsp;&nbsp;{formatNumber(invoice.total_amount)}</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Reminder */}
            <tr>
              <td>&nbsp;</td>
              <td colSpan={3} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>
                <span style={{ fontWeight: 'bold', color: '#969696' }}>Reminder:</span>
                <span style={{ color: '#969696' }}> Please include the statement number on your cheque.</span>
              </td>
              <td></td>
              <td></td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Terms */}
            <tr>
              <td>&nbsp;</td>
              <td colSpan={3} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt' }}>
                <span style={{ fontWeight: 'bold', color: '#969696' }}>Terms:</span>
                <span style={{ color: '#969696' }}> Payment due in 7 days.</span>
              </td>
              <td></td>
              <td></td>
              <td>&nbsp;</td>
              <td></td>
            </tr>
            {/* Empty row */}
            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td>&nbsp;</td><td></td></tr>
            {/* MODE OF PAYMENT header */}
            <tr>
              <td>&nbsp;</td>
              <td colSpan={5} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', color: '#FFFFFF', backgroundColor: '#C5D4E0', textAlign: 'center', borderLeft: '1px solid #DDE9EC' }}>MODE OF PAYMENT</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Cheque row */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderBottom: '1px solid #C0C0C0', borderLeft: '1px solid #DDE9EC' }}>Cheque:</td>
              <td colSpan={2} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', borderTop: '1px solid #DDE9EC', borderBottom: '1px solid #DDE9EC', borderLeft: '1px solid #DDE9EC' }}>&nbsp;Coin Security Services</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF' }}>Coin Security Services</td>
              <td style={{ borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF', borderRight: '1px solid #BFBFBF' }}></td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Bank Transfer row */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderBottom: '1px solid #C0C0C0', borderLeft: '1px solid #DDE9EC' }}>Bank Transfer:</td>
              <td colSpan={2} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', borderTop: '1px solid #DDE9EC', borderBottom: '1px solid #DDE9EC', borderLeft: '1px solid #DDE9EC' }}>First Capital Bank, Capital City Branch</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', fontWeight: 'bold', borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF' }}>Standard Bank Malawi</td>
              <td style={{ borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF', borderRight: '1px solid #BFBFBF' }}></td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Account # row */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderBottom: '1px solid #C0C0C0', borderTop: '1px solid #C0C0C0', borderLeft: '1px solid #DDE9EC' }}>Account #:</td>
              <td colSpan={2} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', borderTop: '1px solid #DDE9EC', borderBottom: '1px solid #DDE9EC', borderLeft: '1px solid #DDE9EC' }}>0635168006</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF' }}>9100005509979</td>
              <td style={{ borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF', borderRight: '1px solid #BFBFBF' }}></td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Branch row */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderBottom: '1px solid #C0C0C0', borderTop: '1px solid #C0C0C0', borderLeft: '1px solid #DDE9EC' }}>Branch:</td>
              <td colSpan={2} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', borderTop: '1px solid #DDE9EC', borderBottom: '1px solid #DDE9EC', borderLeft: '1px solid #DDE9EC' }}>City Centre</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF' }}>City Centre</td>
              <td style={{ borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF', borderRight: '1px solid #BFBFBF' }}></td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Due Date row */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696', borderTop: '1px solid #C0C0C0', borderBottom: '1px solid #DDE9EC', borderLeft: '1px solid #DDE9EC' }}>Due Date:</td>
              <td colSpan={2} style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '10pt', borderTop: '1px solid #DDE9EC', borderBottom: '1px solid #DDE9EC' }}>{formatDate(invoice.due_date)}</td>
              <td style={{ borderTop: '1px solid #BFBFBF' }}></td>
              <td style={{ borderTop: '1px solid #BFBFBF', borderBottom: '1px solid #BFBFBF', borderRight: '1px solid #BFBFBF' }}></td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Empty rows */}
            <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
            {/* Authorised By */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696' }}>Authorised By</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            {/* Empty row */}
            <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
            {/* Signature */}
            <tr>
              <td>&nbsp;</td>
              <td style={{ fontFamily: "'Gill Sans MT', sans-serif", fontSize: '11pt', fontWeight: 'bold', fontStyle: 'italic', color: '#969696' }}>Signature</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}
