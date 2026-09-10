import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faCube,
  faPlus,
  faPen,
  faEllipsisVertical,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { telephonyApi, type ConnectionEntity, type ProductCommEntity } from '../api/telephonyApi';
import { productApi, type ProductEntity } from '@/domains/products/api/productApi';
import { AddIncomingNumberModal } from '../components/AddIncomingNumberModal';
import { ConfirmDialog } from '@/shared/ui/modal/ConfirmDialog';
import { useToast } from '@/shared/ui/toast/ToastProvider';

export function ProductNumbersConfigPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [connection, setConnection] = useState<ConnectionEntity | null>(null);
  const [product, setProduct] = useState<ProductEntity | null>(null);
  const [defaultComm, setDefaultComm] = useState<ProductCommEntity | null>(null);
  const [incomingNumbers, setIncomingNumbers] = useState<ProductCommEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ProductCommEntity | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);
  const [numberToDelete, setNumberToDelete] = useState<ProductCommEntity | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (productId) {
      loadAllData();
    }
  }, [productId]);

  const loadAllData = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const pId = Number(productId);
      const [connRes, prodRes, defCommRes, numbersRes] = await Promise.allSettled([
        telephonyApi.fetchConnections('EXOTEL'),
        productApi.fetchProductById(pId),
        telephonyApi.fetchDefaultProductComm(pId, 'EXOTEL'),
        telephonyApi.fetchProductComms(pId, false, 0, 50),
      ]);

      if (connRes.status === 'fulfilled' && connRes.value.content?.length > 0) {
        setConnection(connRes.value.content[0]);
      }
      if (prodRes.status === 'fulfilled') {
        setProduct(prodRes.value);
      }
      if (defCommRes.status === 'fulfilled') {
        setDefaultComm(defCommRes.value);
      }
      if (numbersRes.status === 'fulfilled') {
        setIncomingNumbers(numbersRes.value.content || []);
      }
    } catch (err) {
      console.error('Failed to load product numbers data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNumber = async () => {
    const item = numberToDelete;
    if (!item || (!item.id && !item.code)) return;
    setDeleting(true);
    try {
      await telephonyApi.deleteProductComm(item.id || item.code!);
      toast(`${item.phoneNumber} removed from this product.`, 'success');
      setNumberToDelete(null);
      loadAllData();
    } catch (err: any) {
      console.error('Failed to delete number:', err);
      toast(err?.message || 'Failed to delete the number.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          onClick={() => navigate('/settings')}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Settings
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span
          onClick={() => navigate('/settings?category=communication')}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Communication
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span
          onClick={() => navigate('/settings/telephony')}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Telephony
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span
          onClick={() => navigate('/settings/telephony/exotel')}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Exotel
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span className="text-foreground font-medium">
          {product?.name || `Product ${productId}`}
        </span>
      </div>

      {/* Top Banner with '+ Add incoming number' Button */}
      <div className="bg-[#fef9ee] border border-[#fae5bb] rounded-2xl p-6 relative overflow-hidden space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#fa8c16]/10 flex items-center justify-center text-[#fa8c16] shrink-0">
            <FontAwesomeIcon icon={faCube} className="text-lg" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-base font-bold text-[#262626]">Telephony</h2>
            <p className="text-xs text-[#595959] leading-relaxed max-w-4xl">
              Telephony in CRM integrates calling capabilities directly into the platform, allowing
              users to make, receive, and log calls within the CRM. It supports features like call
              recording, click-to-call, call analytics, and automatic activity tracking to streamline
              communication and enhance sales productivity.
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              setItemToEdit(null);
              setIsAddNumberModalOpen(true);
            }}
            className="py-2.5 px-5 bg-[#262626] hover:bg-[#1f1f1f] text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            <span>Add incoming number</span>
          </button>
        </div>
      </div>

      {/* Exotel Service Detail Top Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {connection?.connectionDetails?.accountSid
              ? `Exotel service detail (${connection.connectionDetails.accountSid})`
              : 'Exotel service detail one'}
          </h3>
          {connection?.connectionDetails?.callerId && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Default Caller ID: {connection.connectionDetails.callerId}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/settings/telephony/exotel')}
          title="Opens the full Exotel configuration, which covers both calling modes"
          className="px-4 py-2 bg-muted/70 hover:bg-muted text-foreground/80 hover:text-foreground text-xs font-semibold rounded-xl border border-border flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
          <span>Edit configuration</span>
        </button>
      </div>

      {/* Info Strip: Selected Product & Product Number (Outgoing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selected Field Box */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Selected fields</span>
          <div className="p-3.5 bg-card border border-border rounded-xl text-sm font-semibold text-foreground">
            {product?.name || 'Loading...'}
          </div>
        </div>

        {/* Product Number (Outgoing Number) Box */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Product number (Outgoing number)
          </span>
          <div className="p-3.5 bg-card border border-border rounded-xl flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="text-base">🇮🇳</span>
            <span className="text-xs text-muted-foreground">+91</span>
            <span>
              {defaultComm?.phoneNumber ||
                connection?.connectionDetails?.callerId ||
                'No outgoing number configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Table of Configured Incoming Numbers */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-4 px-6 w-16 text-center">S.No</th>
                <th className="py-4 px-6">Source</th>
                <th className="py-4 px-6">Sub Source</th>
                <th className="py-4 px-6">Phone number</th>
                <th className="py-4 px-6 text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                    Loading numbers...
                  </td>
                </tr>
              ) : incomingNumbers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                    No incoming numbers configured for this product yet. Click "+ Add incoming number" above.
                  </td>
                </tr>
              ) : (
                incomingNumbers.map((num, idx) => (
                  <tr key={num.id || num.code || idx} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6 text-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-block px-3 py-1 bg-muted/60 text-foreground text-xs font-semibold rounded-lg">
                        {num.source || 'Direct'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {num.subSource ? (
                        <span className="inline-block px-3 py-1 bg-muted/60 text-foreground text-xs font-medium rounded-lg">
                          {num.subSource}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-foreground">
                      {num.phoneNumber}
                    </td>
                    <td className="py-4 px-6 text-center relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={() =>
                            setActiveActionMenuId(
                              activeActionMenuId === (num.id || idx) ? null : (num.id || idx)
                            )
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faEllipsisVertical} />
                        </button>

                        {/* Action Menu Dropdown */}
                        {activeActionMenuId === (num.id || idx) && (
                          <div className="absolute right-6 top-12 z-20 w-32 bg-card border border-border rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => {
                                setItemToEdit(num);
                                setIsAddNumberModalOpen(true);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faPen} className="text-xs text-muted-foreground" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setNumberToDelete(num);
                                setActiveActionMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!numberToDelete}
        tone="danger"
        title="Remove this incoming number?"
        confirmLabel="Remove number"
        busy={deleting}
        onCancel={() => setNumberToDelete(null)}
        onConfirm={handleDeleteNumber}
        message={
          <>
            Calls to{' '}
            <span className="font-semibold text-foreground font-mono">
              {numberToDelete?.phoneNumber}
            </span>{' '}
            will no longer be routed to this product. The number itself stays on your Exotel
            account.
          </>
        }
      />

      {/* Add / Edit Incoming Number Modal */}
      <AddIncomingNumberModal
        isOpen={isAddNumberModalOpen}
        onClose={() => {
          setIsAddNumberModalOpen(false);
          setItemToEdit(null);
        }}
        productId={Number(productId)}
        connectionName={connection?.name || 'exotel_connection'}
        itemToEdit={itemToEdit}
        onSaveSuccess={() => {
          loadAllData();
        }}
      />
    </div>
  );
}
