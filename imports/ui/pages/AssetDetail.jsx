import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams, Link } from 'react-router-dom';
import { Assets } from '../../api/assets/assets';
import { Tickets } from '../../api/tickets/tickets';
import moment from 'moment';

export const AssetDetail = () => {
    const { id } = useParams();

    const { asset, tickets, isLoading } = useTracker(() => {
        const assetHandle = Meteor.subscribe('assets.byId', id);
        const ticketsHandle = Meteor.subscribe('tickets.byAsset', id);

        return {
            asset: Assets.findOne(id),
            tickets: Tickets.find({ assetId: id }, { sort: { createdAt: -1 } }).fetch(),
            isLoading: !assetHandle.ready() || !ticketsHandle.ready()
        };
    });

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!asset) return <div className="p-8 text-center">Asset not found</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link to="/admin/assets" className="text-blue-600 hover:underline flex items-center mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Assets
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{asset.assetTag} - {asset.name}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Asset Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">Asset Information</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Type</label>
                                <p className="font-medium">{asset.type}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Brand/Model</label>
                                <p className="font-medium">{asset.brand} {asset.model}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Serial Number</label>
                                <p className="font-mono bg-gray-100 p-1 rounded inline-block">{asset.serialNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Status</label>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${asset.status === 'Active' ? 'bg-green-100 text-green-800' :
                                        asset.status === 'InRepair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {asset.status}
                                </span>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Assigned To</label>
                                <p className="font-medium">{asset.assignedToName || 'Unassigned'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Location</label>
                                <p className="font-medium">{asset.location || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Purchase Date</label>
                                <p className="font-medium">{asset.purchaseDate ? moment(asset.purchaseDate).format('LL') : 'N/A'}</p>
                            </div>
                            {asset.notes && (
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Notes</label>
                                    <p className="text-gray-700 text-sm">{asset.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ticket History */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-bold mb-4 border-b pb-2">Ticket History ({tickets.length})</h2>

                        {tickets.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No tickets linked to this asset.</p>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map(ticket => (
                                    <div key={ticket._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Link to={`/tickets/${ticket._id}`} className="text-blue-600 font-bold hover:underline">
                                                    {ticket.ticketNumber}
                                                </Link>
                                                <h3 className="text-sm font-medium text-gray-900 mt-1">{ticket.title}</h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Reported by {ticket.reporterName || 'User'} • {moment(ticket.createdAt).fromNow()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full mb-1 ${ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                                        ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-xs text-gray-400">{ticket.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
