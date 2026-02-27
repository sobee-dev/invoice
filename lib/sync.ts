import { db } from './db';

export async function performInitialSync(data: any) {
    
   try {
        return await db.transaction('rw', ['users', 'business', 'receipts', 'receiptItems'], async () => { 
    
            if (data.tokens?.access) {
                localStorage.setItem("token", data.tokens.access);
            }

            // 1. Map User    
            if (data.user?.id) {
                await db.users.put({
                id: data.user.id,
                email: data.user.email,
                business: data.user.business ?? false
                });
            }

            // 2. Map Business
            if (data.business?.id) {
            await db.business.put({
                // Primary Key (UUID from Django)
                id: data.business.id,
                
                // Core Info
                name: data.business.name || "",
                description: data.business.description || "",
                motto: data.business.motto || "",
                
                // Contact Info
                addressOne: data.business.addressOne || "",
                addressTwo: data.business.addressTwo || "", // Django null=True handled by fallback
                phone: data.business.phone || "",
                email: data.business.email || "",
                registrationNumber: data.business.registrationNumber || "",
                
                // Financials
                currency: data.business.currency || "USD",
                taxRate: Number(data.business.taxRate) || 0, // DecimalField often comes as string
                taxEnabled: data.business.taxEnabled ?? false,
                
                // Branding & UI
                brandColorOne: data.business.brandColorOne || "",
                brandColorTwo: data.business.brandColorTwo || "",
                logoUrl: data.business.logoUrl || "",
                selectedTemplateId: data.business.selectedTemplateId || "template-classic",
                onboardingComplete: data.business.onboardingComplete ?? false,
                
                // Signatures (Matches your Django choices: none, text, image)
                signatureType: data.business.signatureType || "none",
                signatureText: data.business.signatureText || "",
                signatureUrl: data.business.signatureUrl || "",
                
                // Timestamps & Sync
                createdAt: data.business.createdAt,
                updatedAt: data.business.updatedAt,
                serverId: data.business.serverId, // Optional field from your model
                
                // Local Metadata
                syncStatus: 'synced' // Hardcoded because we just fetched it from the server
            });
            }

            // 3. Map Receipts (Bulk)
            const receipts = Array.isArray(data.receipts) ? data.receipts : [];

            if (receipts.length > 0) {
            const mappedReceipts = receipts.map((r: any) => ({
                // IDs
                id: r.id,
                serverId: r.serverId,
                businessId: r.businessId || r.business, // Handle if backend sends the ID directly or nested
                templateId: r.templateId || r.template,

                // Header Info
                receiptNumber: r.receiptNumber || "",
                receiptDate: r.receiptDate,
                
                // Customer Info
                customerName: r.customerName || "",
                customerPhone: r.customerPhone || "",
                customerEmail: r.customerEmail || "",

                // Financials (Ensuring they are Numbers, not Strings)
                subtotal: Number(r.subtotal) || 0,
                taxRate: Number(r.taxRate) || 0,
                taxAmount: Number(r.taxAmount) || 0,
                discount: Number(r.discount) || 0,
                grandTotal: Number(r.grandTotal) || 0,

                // Status & Metadata
                notes: r.notes || "",
                isPaid: r.isPaid ?? false,
                paidAt: r.paidAt,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                deletedAt: r.deletedAt,
                
                // Force Local Sync Status
                syncStatus: 'synced'
            }));

            await db.receipts.bulkPut(mappedReceipts);
            }

            // 4. Map Items
            const items = Array.isArray(data.receiptItems) ? data.receiptItems : [];
            if (items.length > 0) {
                const mappedItems = items.map((i: any) => ({
                    id: i.id,
                    receiptId: i.receiptId || i.receipt, // Map from Django 'receipt' to TS 'receiptId'
                    description: i.description || "",
                    
                    // Quantities and Prices (Handling Decimal precision)
                    quantity: Number(i.quantity) || 0,
                    unitPrice: Number(i.unitPrice) || 0,
                    total: Number(i.total) || 0
                }));

                await db.receiptItems.bulkPut(mappedItems);
            }
    });
  } catch (err) {
    console.error("Critical Sync Failure:", err);
    // We throw the error so handleLogin knows to stop the redirect
    throw err;
    }
}