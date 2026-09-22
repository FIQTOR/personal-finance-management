import React from 'react';

interface ReceiptItem {
    detail?: { title?: string; name?: string };
    item_type?: string;
    price?: number;
    quantity?: number;
}

interface ReceiptTransaction {
    created_at: string;
    transaction_id?: string;
    order_id?: string;
    payment_status?: string;
    payment_type?: string;
    amount?: number;
    user?: { name?: string; email?: string };
    items?: ReceiptItem[];
}

interface ReceiptProps {
    transaction: ReceiptTransaction;
    formatCurrency: (amount: number) => string;
}

export const ReceiptPrint = React.forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, formatCurrency }, ref) => {
    // Format Date and Time separately for clarity
    const dateObj = new Date(transaction.created_at);
    const formattedDate = dateObj.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const formattedTime = dateObj.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    return (
        <div ref={ref} className="p-12 bg-white text-slate-900 w-full max-w-2xl mx-auto print:p-8 relative overflow-hidden">

            {/* Background Decoration */}
            <div className="absolute -top-12.5 -right-12.5 w-64 h-64 bg-slate-50 rounded-full -z-10 opacity-50" />
            <div className="absolute -bottom-25 -left-25 w-80 h-80 bg-slate-50 rounded-full -z-10 opacity-30" />

            {/* Header Section */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <div className='flex items-center mb-4 gap-2'>
                        <img src="/img/icon.webp" alt="Logo" className="w-8 h-8 object-contain" />
                        <span className='text-black font-black text-xl tracking-tighter'>IARTY</span>
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-950">
                        Receipt
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Invoice No: {transaction.transaction_id}
                    </p>
                </div>
                <div className="text-right">
                    <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase mb-3 ${transaction.payment_status?.toLowerCase() === 'paid' || transaction.payment_status?.toLowerCase() === 'settlement'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                        }`}>
                        {transaction.payment_status}
                    </div>
                    <p className="text-sm font-bold text-slate-800">{formattedDate}</p>
                    <p className="text-xs font-medium text-slate-400">{formattedTime} WIB</p>
                </div>
            </div>

            {/* Client & Transaction Meta */}
            <div className="grid grid-cols-2 gap-12 mb-12 pb-8 border-b border-slate-100">
                <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Billed To</h4>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                        {transaction.user?.name || 'Valued Customer'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 italic">
                        {transaction.user?.email || 'No email provided'}
                    </p>
                </div>
                <div className="text-right">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-[0.2em]">Payment Detail</h4>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-600">
                            <span className="font-medium">Method:</span> <span className="font-bold uppercase">{transaction.payment_type?.replace(/_/g, ' ') || 'MIDTRANS'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                            Order Reference: {transaction.order_id || transaction.transaction_id}
                        </p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-10">
                <thead>
                    <tr className="text-left text-[10px] font-black uppercase text-slate-400 border-b-2 border-slate-900">
                        <th className="py-3 px-2">Description</th>
                        <th className="py-3 text-center">Qty</th>
                        <th className="py-3 text-right pr-2">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {transaction.items?.map((item: ReceiptItem, idx: number) => (
                        <tr key={idx} className="group">
                            <td className="py-6 px-2">
                                <p className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                                    {item.detail?.title || item.detail?.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                    Type: {item.item_type || 'Digital Product'}
                                </p>
                            </td>
                            <td className="py-6 text-center text-sm font-bold text-slate-600">01</td>
                            <td className="py-6 text-right pr-2 text-sm font-black text-slate-950">
                                {formatCurrency(item.price ?? transaction.amount ?? 0)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary */}
            <div className="flex justify-between items-start pt-6 border-t border-slate-100">
                <div className="max-w-70">
                    <h4 className="text-[10px] font-black uppercase text-slate-900 mb-2">Terms & Notes:</h4>
                    <p className="text-[9px] text-slate-400 leading-relaxed uppercase font-medium">
                        This is a valid proof of payment for digital services provided by IARTY.
                        Access to digital content is granted immediately upon successful settlement.
                        Keep this receipt for your records.
                    </p>
                </div>

                <div className="w-full max-w-55 space-y-3">
                    <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-tighter">Subtotal</span>
                        <span className="font-bold text-slate-700">{formatCurrency(transaction.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-tighter">Processing Fee</span>
                        <span className="font-bold text-slate-700">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-900">
                        <span className="text-xs font-black uppercase tracking-widest">Total Paid</span>
                        <span className="text-xl font-black text-slate-950">
                            {formatCurrency(transaction.amount ?? 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Branding Footer */}
            <div className="mt-32 flex justify-between items-end border-t border-slate-50 pt-8">
                <div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-1">Generated By IARTY System</p>
                    <p className="text-[9px] text-slate-400 font-medium tracking-tight">Timestamp: {new Date().toISOString()}</p>
                </div>
                <div className="text-right">
                    <div className="mb-2">
                        <img src="/img/icon.webp" alt="Logo" className="w-6 h-6 object-contain ml-auto opacity-20 grayscale" />
                    </div>
                    <p className="text-[9px] font-black text-slate-300 uppercase italic">Digital Signature Verified</p>
                </div>
            </div>
        </div>
    );
});

ReceiptPrint.displayName = "ReceiptPrint";