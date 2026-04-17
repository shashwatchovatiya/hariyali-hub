import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useUserData from '../hooks/useUserData';
import { fetchSellerOrdersAsync, fetchSellerOrderByIdAsync, updateOrderItemStatusAsync } from '../features/nursery/sellerOrdersSlice';
import './styles/NurseryOrderTracker.scss';

const NurseryOrderTracker = () => {
  document.title = "Track Orders - Nursery";

  const { userData: user } = useUserData();
  const nursery = useSelector(state => state.nursery.nursery);
  const { orders, currentOrder, loading, currentPage, totalPages, totalOrders } = useSelector(state => state.sellerOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusByItem, setStatusByItem] = useState({});
  const [updatingItemId, setUpdatingItemId] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/nursery/orders/track");
    } else if (!user.role.includes("seller") || !nursery) {
      navigate("/nursery/create");
    }
  }, [user, nursery, navigate]);

  useEffect(() => {
    if (nursery) {
      dispatch(fetchSellerOrdersAsync({ page, orderSearch, status: statusFilter }));
    }
  }, [page, orderSearch, statusFilter, nursery, dispatch]);

  const handleOrderClick = (orderId) => {
    setSelectedOrder(orderId);
    dispatch(fetchSellerOrderByIdAsync(orderId));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setOrderSearch(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setPage(1);
    setStatusFilter(status);
  };

  const handleStatusChange = (itemId, nextStatus) => {
    setStatusByItem((prev) => ({ ...prev, [itemId]: nextStatus }));
  };

  const handleUpdateStatus = async (orderId, itemIndex, itemId) => {
    const nextStatus = statusByItem[itemId];
    if (!nextStatus) {
      return;
    }

    setUpdatingItemId(itemId);
    const action = await dispatch(
      updateOrderItemStatusAsync({
        orderId,
        itemIndex,
        status: nextStatus,
        message: `Order status updated to ${nextStatus}`,
      })
    );

    if (action.meta.requestStatus === 'fulfilled') {
      dispatch(fetchSellerOrderByIdAsync(orderId));
      dispatch(fetchSellerOrdersAsync({ page, orderSearch, status: statusFilter }));
    }

    setUpdatingItemId('');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': 'warning',
      'Processing': 'info',
      'Shipped': 'primary',
      'Completed': 'success',
      'Cancelled': 'danger'
    };
    return statusMap[status] || 'secondary';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nursery-order-tracker container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="mb-0">Order Tracker</h1>
          <p className="text-muted">Track and manage your plant orders</p>
        </div>
      </div>

      <div className="row">
        {/* Orders List */}
        <div className={`${selectedOrder ? 'col-lg-6' : 'col-12'} mb-4`}>
          <div className="card">
            <div className="card-header">
              <h5 className="mb-3">Your Orders ({totalOrders})</h5>
              
              {/* Filters */}
              <div className="row g-2">
                <div className="col-12">
                  <input 
                    type="text" 
                    className="form-control form-control-sm"
                    placeholder="Search by order ID or plant name..."
                    value={orderSearch}
                    onChange={handleSearch}
                  />
                </div>
                <div className="col-12">
                  <div className="btn-group w-100" role="group">
                    <button 
                      type="button" 
                      className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleStatusFilter('')}
                    >
                      All
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={() => handleStatusFilter('Pending')}
                    >
                      Pending
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${statusFilter === 'Processing' ? 'btn-info' : 'btn-outline-info'}`}
                      onClick={() => handleStatusFilter('Processing')}
                    >
                      Processing
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${statusFilter === 'Shipped' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleStatusFilter('Shipped')}
                    >
                      Shipped
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${statusFilter === 'Completed' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleStatusFilter('Completed')}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {orders.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted mt-3">No orders found</p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <div 
                      key={order._id} 
                      className={`order-item p-3 mb-2 border rounded cursor-pointer ${selectedOrder === order._id ? 'selected' : ''}`}
                      onClick={() => handleOrderClick(order._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">Order #{order._id.substring(0, 8).toUpperCase()}</h6>
                          <p className="mb-1 text-muted small">
                            {order.orderItems.map(item => item.plantName).join(', ')}
                          </p>
                          <small className="text-muted">
                            {new Date(order.orderAt).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge bg-${getStatusBadge(order.orderItems[0]?.orderStatus?.status || 'Pending')}`}>
                            {order.orderItems[0]?.orderStatus?.status || 'Pending'}
                          </span>
                          <p className="mb-0 mt-2 fw-bold">₹{order.pricing?.totalPrice?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer">
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page - 1)}>
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setPage(i + 1)}>
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setPage(page + 1)}>
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        {selectedOrder && currentOrder && (
          <div className="col-lg-6 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Order Details</h5>
              </div>
              <div className="card-body">
                <div className="order-details">
                  {currentOrder.orderItems.map((item, idx) => (
                    <div key={idx} className="mb-4 pb-4 border-bottom">
                      <div className="row mb-3">
                        <div className="col-4">
                          <img 
                            src={item.images?.url} 
                            alt={item.plantName}
                            className="img-fluid rounded"
                          />
                        </div>
                        <div className="col-8">
                          <h6>{item.plantName}</h6>
                          <p className="text-muted small mb-1">
                            <strong>Quantity:</strong> {item.quantity}
                          </p>
                          <p className="text-muted small mb-1">
                            <strong>Price:</strong> ₹{item.price?.toLocaleString()}
                          </p>
                          <p className="text-muted small">
                            <strong>Discount:</strong> {item.discount}%
                          </p>
                        </div>
                      </div>

                      <div className="status-update">
                        <label className="form-label small">
                          <strong>Current Status:</strong>
                        </label>
                        <span className={`badge bg-${getStatusBadge(item.orderStatus?.status || 'Pending')}`}>
                          {item.orderStatus?.status || 'Pending'}
                        </span>
                        {item.orderStatus?.statusAt && (
                          <p className="text-muted small mt-2 mb-0">
                            Updated: {new Date(item.orderStatus.statusAt).toLocaleString()}
                          </p>
                        )}

                        <div className="row g-2 mt-3">
                          <div className="col-sm-8">
                            <select
                              className="form-select form-select-sm"
                              value={statusByItem[item._id] || item.orderStatus?.status || 'Pending'}
                              onChange={(e) => handleStatusChange(item._id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                          <div className="col-sm-4">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary w-100"
                              onClick={() => handleUpdateStatus(currentOrder._id, idx, item._id)}
                              disabled={updatingItemId === item._id}
                            >
                              {updatingItemId === item._id ? 'Updating...' : 'Update'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Shipping Info */}
                  <div className="shipping-info mt-4">
                    <h6 className="mb-3">Shipping Information</h6>
                    <div className="row">
                      <div className="col-6">
                        <p className="small mb-1"><strong>Name:</strong></p>
                        <p className="text-muted small">{currentOrder.shippingInfo?.name}</p>
                      </div>
                      <div className="col-6">
                        <p className="small mb-1"><strong>Phone:</strong></p>
                        <p className="text-muted small">{currentOrder.shippingInfo?.phone}</p>
                      </div>
                      <div className="col-12">
                        <p className="small mb-1"><strong>Address:</strong></p>
                        <p className="text-muted small">
                          {currentOrder.shippingInfo?.address}, {currentOrder.shippingInfo?.city}, {currentOrder.shippingInfo?.state} - {currentOrder.shippingInfo?.pinCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NurseryOrderTracker;
