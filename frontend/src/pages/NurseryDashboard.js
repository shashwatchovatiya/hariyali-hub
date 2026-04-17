import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useUserData from '../hooks/useUserData';
import { fetchSellerOrderStatsAsync } from '../features/nursery/sellerOrdersSlice';
import './styles/NurseryDashboard.scss';

const NurseryDashboard = () => {
  document.title = "Nursery Dashboard";

  const { userData: user } = useUserData();
  const nursery = useSelector(state => state.nursery.nursery);
  const { stats, loading } = useSelector(state => state.sellerOrders);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/nursery/dashboard");
    } else if (!user.role.includes("seller") || !nursery) {
      navigate("/nursery/create");
    }
  }, [user, nursery, navigate]);

  useEffect(() => {
    if (nursery) {
      dispatch(fetchSellerOrderStatsAsync());
    }
  }, [nursery, dispatch]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nursery-dashboard container py-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="mb-0">Nursery Dashboard</h1>
          <p className="text-muted">{nursery?.nurseryName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon pending">
                <i className="fas fa-hourglass-start"></i>
              </div>
              <h6 className="card-title">Pending Orders</h6>
              <h2 className="stat-value">{stats?.pendingOrders || 0}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon completed">
                <i className="fas fa-check-circle"></i>
              </div>
              <h6 className="card-title">Completed Orders</h6>
              <h2 className="stat-value">{stats?.completedOrders || 0}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon total">
                <i className="fas fa-box"></i>
              </div>
              <h6 className="card-title">Total Orders</h6>
              <h2 className="stat-value">{stats?.totalOrders || 0}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stat-card">
            <div className="card-body">
              <div className="stat-icon revenue">
                <i className="fas fa-rupee-sign"></i>
              </div>
              <h6 className="card-title">Total Revenue</h6>
              <h2 className="stat-value">₹{stats?.totalRevenue?.toLocaleString() || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="mb-3">Quick Actions</h4>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <button 
            className="btn btn-primary w-100 action-btn"
            onClick={() => navigate('/orders/history')}
          >
            <i className="fas fa-eye"></i>
            <span>View All Orders</span>
          </button>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <button 
            className="btn btn-success w-100 action-btn"
            onClick={() => navigate('/nursery/plant/new')}
          >
            <i className="fas fa-plus"></i>
            <span>Add New Plant</span>
          </button>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <button 
            className="btn btn-warning w-100 action-btn"
            onClick={() => navigate('/nursery/update')}
          >
            <i className="fas fa-edit"></i>
            <span>Edit Nursery</span>
          </button>
        </div>
        <div className="col-md-6 col-lg-3 mb-3">
          <button 
            className="btn btn-info w-100 action-btn"
            onClick={() => navigate('/nursery/orders/track')}
          >
            <i className="fas fa-truck"></i>
            <span>Track Orders</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Dashboard Overview</h5>
            </div>
            <div className="card-body">
              <p className="text-muted mb-0">
                Welcome to your Nursery Dashboard! Here you can manage your orders, track shipments, 
                and monitor your nursery's performance. Use the quick action buttons above to navigate 
                to different sections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseryDashboard;
