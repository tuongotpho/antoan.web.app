import React, { useState, useMemo } from 'react';
import { PartnerProfile, TrainingRequest } from '../../types';
import KPIStatCard from '../KPIStatCard';
import GrowthChart from '../GrowthChart';
import { xepHangLoaiHinh } from '../../utils/thongKeThang';
import InfoPanel from '../InfoPanel';
import PendingPartnerCard from '../PendingPartnerCard';
import PartnerTable from '../PartnerTable';
import TrainingRequestCard from '../TrainingRequestCard';
import PartnerDetailModal from '../PartnerDetailModal';
import ViewersModal from '../ViewersModal';

interface DashboardTabProps {
    partners: PartnerProfile[];
    requests: TrainingRequest[];
    onUpdatePartnerStatus: (uid: string, newStatus: 'approved' | 'rejected') => void;
    onDeletePartner: (uid: string) => void;
    onDeleteRequest: (id: string) => void;
    onUpdatePartner: (uid: string, updates: Partial<PartnerProfile>) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    partners,
    requests,
    onUpdatePartnerStatus,
    onDeletePartner,
    onDeleteRequest,
    onUpdatePartner,
}) => {
    const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(null);
    const [viewingPartners, setViewingPartners] = useState<PartnerProfile[] | null>(null);

    // Memoized calculations for the dashboard
    const dashboardData = useMemo(() => {
        const pPartners = partners.filter((p) => p.status === 'pending');
        const aPartners = partners.filter((p) => p.status === 'approved');
        const uRequests = requests.filter((r) => r.urgent);

        // Quy tắc xếp hạng nằm trong utils/thongKeThang.ts để test được.
        // Mẫu số là TỔNG SỐ LƯỢT CHỌN chứ không phải số yêu cầu — xem chú thích
        // trong hàm đó để hiểu vì sao.
        const hotTrainingTypes = xepHangLoaiHinh(requests, 3).map((x) => ({
            text: `${x.loai}: ${x.soLuot} lượt chọn`,
            details: `${x.tiLe}%`,
        }));

        // Calculate "Needs Attention" items
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const oldPendingPartnersCount = pPartners.filter((p) => {
            // Ensure createdAt is not null and is a Firestore Timestamp
            // Timestamp check
            return p.createdAt && 'toDate' in p.createdAt && p.createdAt.toDate() < threeDaysAgo;
        }).length;

        const unviewedRequestsCount = requests.filter(
            (r) => !r.viewedBy || r.viewedBy.length === 0
        ).length;

        const attentionItems = [];
        if (oldPendingPartnersCount > 0) {
            attentionItems.push({ text: `${oldPendingPartnersCount} đối tác chờ duyệt > 3 ngày` });
        }
        if (unviewedRequestsCount > 0) {
            attentionItems.push({ text: `${unviewedRequestsCount} yêu cầu chưa có ai xem` });
        }

        return {
            totalRequests: requests.length,
            approvedPartnersCount: aPartners.length,
            urgentRequestsCount: uRequests.length,
            pendingPartnersCount: pPartners.length,
            hotTrainingTypes,
            attentionItems,
        };
    }, [partners, requests]);

    const pendingPartners = partners.filter((p) => p.status === 'pending');
    const managedPartners = partners.filter(
        (p) => p.status === 'approved' || p.status === 'rejected'
    );

    const handleShowViewers = (request: TrainingRequest) => {
        if (!request.viewedBy || request.viewedBy.length === 0) return;
        const viewers = partners.filter((p) => request.viewedBy.includes(p.uid));
        setViewingPartners(viewers);
    };

    const handleApproveFromModal = (uid: string) => {
        onUpdatePartnerStatus(uid, 'approved');
        setSelectedPartner(null);
    };

    const handleRejectFromModal = (uid: string) => {
        onUpdatePartnerStatus(uid, 'rejected');
        setSelectedPartner(null);
    };

    return (
        <>
            {/* --- Start of Dashboard --- */}
            <section className="mb-12">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPIStatCard
                        icon="fa-file-alt"
                        title="Tổng số yêu cầu"
                        value={dashboardData.totalRequests.toString()}
                        details="Tất cả thời gian"
                    />
                    <KPIStatCard
                        icon="fa-handshake"
                        title="Đối tác đã duyệt"
                        value={dashboardData.approvedPartnersCount.toString()}
                        details="Đang hoạt động"
                    />
                    <KPIStatCard
                        icon="fa-exclamation-circle"
                        title="Yêu cầu khẩn cấp"
                        value={dashboardData.urgentRequestsCount.toString()}
                        details="Cần ưu tiên"
                    />
                    <KPIStatCard
                        icon="fa-user-clock"
                        title="Đối tác chờ duyệt"
                        value={dashboardData.pendingPartnersCount.toString()}
                        details="Cần hành động"
                    />
                </div>
                {/* Chart and Info Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <GrowthChart
                            title="Tăng trưởng (6 tháng qua)"
                            requests={requests}
                            partners={partners}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <InfoPanel
                            icon="fa-fire"
                            title="Loại hình đào tạo 'Hot'"
                            items={dashboardData.hotTrainingTypes}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <InfoPanel
                            icon="fa-bell"
                            title="Cần chú ý"
                            items={dashboardData.attentionItems}
                            theme="danger"
                        />
                    </div>
                </div>
            </section>
            {/* --- End of Dashboard --- */}

            <div className="space-y-12">
                <section>
                    <h2 className="text-2xl font-bold text-yellow-600 mb-4">
                        Đối tác chờ phê duyệt ({pendingPartners.length})
                    </h2>
                    {pendingPartners.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {pendingPartners.map((partner) => (
                                <PendingPartnerCard
                                    key={partner.uid}
                                    partner={partner}
                                    onApprove={() => onUpdatePartnerStatus(partner.uid, 'approved')}
                                    onReject={() => onUpdatePartnerStatus(partner.uid, 'rejected')}
                                    onViewDetails={setSelectedPartner}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md border">
                            <p className="text-neutral-dark">Không có đối tác nào đang chờ phê duyệt.</p>
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">
                        Danh sách Đối tác ({managedPartners.length})
                    </h2>
                    <PartnerTable
                        partners={managedPartners}
                        onDelete={onDeletePartner}
                        viewType="managed"
                        onViewDetails={setSelectedPartner}
                    />
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-primary mb-4">
                        Quản lý Yêu cầu ({requests.length})
                    </h2>
                    {requests.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {requests.map((request) => (
                                <TrainingRequestCard
                                    key={request.id}
                                    request={request}
                                    isAdminView={true}
                                    onDeleteRequest={onDeleteRequest}
                                    onShowViewers={handleShowViewers}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md border">
                            <p className="text-neutral-dark">Không có yêu cầu nào.</p>
                        </div>
                    )}
                </section>
            </div>

            {selectedPartner && (
                <PartnerDetailModal
                    partner={selectedPartner}
                    onClose={() => setSelectedPartner(null)}
                    onApprove={handleApproveFromModal}
                    onReject={handleRejectFromModal}
                    onUpdate={onUpdatePartner}
                />
            )}
            {viewingPartners && (
                <ViewersModal partners={viewingPartners} onClose={() => setViewingPartners(null)} />
            )}
        </>
    );
};

export default DashboardTab;
