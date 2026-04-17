import React from 'react'
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useUserData from '../../../hooks/useUserData';

const ProfileSideNav = () => {
    const {userData:user} = useUserData();

    return (
        <div className="card mb-4 mb-lg-0">
            <div className="card-body p-0">
                <ul className="list-group list-group-flush rounded-3">
                    <Link to={"/orders-history"}>
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <i className="fas fa-history fa-lg text-warning"></i>
                            <p className="mb-0">Orders History</p>
                        </li>
                    </Link>
                    <Link to="/orders/history">
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <i className="fas fa-truck fa-lg text-warning"></i>
                            <p className="mb-0">Track Your Orders</p>
                        </li>
                    </Link>
                    <Link to={"/address"}>
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <i className="fas fa-address-card fa-lg text-warning"></i>
                            <p className="mb-0">Manage Your Address</p>
                        </li>
                    </Link>
                    
                    {/* Seller Specific Items */}
                    {user && user.role.includes("seller") && (
                        <>
                            <Link to={"/nursery/dashboard"}>
                                <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <i className="fas fa-chart-line fa-lg text-success"></i>
                                    <p className="mb-0">Nursery Dashboard</p>
                                </li>
                            </Link>
                            <Link to={"/nursery/order"}>
                                <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <i className="fas fa-tasks fa-lg text-info"></i>
                                    <p className="mb-0">Manage Your Orders</p>
                                </li>
                            </Link>
                            <Link to={"/nursery/orders/track"}>
                                <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <i className="fas fa-box fa-lg text-info"></i>
                                    <p className="mb-0">Track Your Shipment</p>
                                </li>
                            </Link>
                            <Link to={"/nursery/plants"}>
                                <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                                    <i className="fas fa-leaf fa-lg text-success"></i>
                                    <p className="mb-0">Add Selling Plants</p>
                                </li>
                            </Link>
                        </>
                    )}

                    <Link to={user.role.includes("seller") ? "/nursery" : "/nursery/create"}>
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <i className="fas fa-tree fa-lg text-warning"></i>
                            <p className="mb-0">{user.role.includes("seller") ? "Manage Your Nursery" : "Add Your Nursery"}</p>
                        </li>
                    </Link>
                    <Link to={"/profile/settings"}>
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <i className="fa fa-gear fa-lg text-warning"></i>
                            <p className="mb-0">Settings</p>
                        </li>
                    </Link>
                    <Link to={"/logout"}>
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3">
                            <i className="fa fa-sign-out text-warning"></i>
                            <p className="mb-0">Logout</p>
                        </li>
                    </Link>
                </ul>
            </div>
        </div>
    )
}

export default ProfileSideNav