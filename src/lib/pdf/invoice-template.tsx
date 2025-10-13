import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

/**
 * Invoice PDF Template
 *
 * Professional invoice template using React-PDF.
 * Generates downloadable/emailable PDF invoices for production orders.
 */

// Define styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2px solid #2563EB',
    paddingBottom: 20,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billToBox: {
    flex: 1,
    marginRight: 20,
  },
  invoiceDetails: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 10,
    color: '#1E293B',
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 10,
    fontWeight: 'bold',
    borderBottom: '2px solid #CBD5E1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #E2E8F0',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  col1: {
    width: '40%',
  },
  col2: {
    width: '15%',
    textAlign: 'right',
  },
  col3: {
    width: '15%',
    textAlign: 'right',
  },
  col4: {
    width: '15%',
    textAlign: 'right',
  },
  col5: {
    width: '15%',
    textAlign: 'right',
  },
  totals: {
    marginLeft: 'auto',
    width: '40%',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  grandTotal: {
    borderTop: '2px solid #2563EB',
    paddingTop: 12,
    marginTop: 12,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid #E2E8F0',
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderLeft: '4px solid #2563EB',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 1.5,
  },
});

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: string;

  // Company info
  companyName: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyZip?: string;
  companyPhone?: string;
  companyEmail?: string;

  // Customer info
  customerName: string;
  customerCompany?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerEmail?: string;

  // Line items
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }>;

  // Totals
  subtotal: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  shipping?: number;
  total: number;
  amountPaid?: number;
  amountDue?: number;

  // Optional fields
  notes?: string;
  terms?: string;
  orderNumber?: string;
}

export const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.companyDetails}>
              {data.companyAddress && `${data.companyAddress}\n`}
              {data.companyCity && data.companyState && data.companyZip &&
                `${data.companyCity}, ${data.companyState} ${data.companyZip}\n`}
              {data.companyPhone && `Phone: ${data.companyPhone}\n`}
              {data.companyEmail && `Email: ${data.companyEmail}`}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.billTo}>
          <View style={styles.billToBox}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.value}>{data.customerName}</Text>
            {data.customerCompany && (
              <Text style={styles.value}>{data.customerCompany}</Text>
            )}
            {data.customerAddress && (
              <Text style={styles.value}>{data.customerAddress}</Text>
            )}
            {data.customerCity && data.customerState && data.customerZip && (
              <Text style={styles.value}>
                {data.customerCity}, {data.customerState} {data.customerZip}
              </Text>
            )}
            {data.customerEmail && (
              <Text style={styles.value}>{data.customerEmail}</Text>
            )}
          </View>

          <View style={styles.invoiceDetails}>
            <View>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>{formatDate(data.invoiceDate)}</Text>
            </View>
            {data.dueDate && (
              <View>
                <Text style={styles.label}>Due Date</Text>
                <Text style={styles.value}>{formatDate(data.dueDate)}</Text>
              </View>
            )}
            {data.orderNumber && (
              <View>
                <Text style={styles.label}>Order Number</Text>
                <Text style={styles.value}>{data.orderNumber}</Text>
              </View>
            )}
            <View>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Unit Price</Text>
            <Text style={styles.col4}>Discount</Text>
            <Text style={styles.col5}>Total</Text>
          </View>

          {data.lineItems.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : null] as any}
            >
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.col4}>
                {item.discount ? formatCurrency(item.discount) : '-'}
              </Text>
              <Text style={styles.col5}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
          </View>

          {data.discount && data.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-{formatCurrency(data.discount)}</Text>
            </View>
          )}

          {data.shipping && data.shipping > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.shipping)}</Text>
            </View>
          )}

          {data.tax && data.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax {data.taxRate ? `(${data.taxRate}%)` : ''}
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(data.tax)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(data.amountDue || data.total)}
            </Text>
          </View>

          {data.amountPaid && data.amountPaid > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={styles.totalValue}>-{formatCurrency(data.amountPaid)}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {data.terms && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{data.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text style={{ marginTop: 8 }}>
            This is a computer-generated invoice and does not require a signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
