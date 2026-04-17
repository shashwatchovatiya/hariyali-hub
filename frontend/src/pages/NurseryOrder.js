import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserData from "../hooks/useUserData";
import handelDataFetch from "../utils/handelDataFetch";
import ProfileSideNav from "../features/user/Components/ProfileSideNav";
import { Card, Table, Space, Empty, Spin, Button, message, Tag, Input, Select } from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import "./styles/NurseryOrder.scss";

const NurseryOrder = () => {
  const navigate = useNavigate();
  const { userData: user, isLoading: isUserLoading } = useUserData();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    if (user && !user.role.includes("seller")) {
      message.warning("You need to create a nursery first to manage orders.");
      setTimeout(() => navigate("/nursery/create"), 1500);
      return;
    }
    if (user && user.role.includes("seller")) {
      fetchSellerOrders();
    }
  }, [user, isUserLoading, navigate]);

  const fetchSellerOrders = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { orderSearch: search }),
        ...(status && { status })
      });

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await Promise.race([
        handelDataFetch(`/api/v2/nursery/orders?${params}`, "GET"),
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("AbortError")));
        })
      ]);

      clearTimeout(timeoutId);

      if (response?.data?.status) {
        const data = response.data;
        setOrders(data.result || []);
        setPagination({
          current: data.page,
          pageSize: 10,
          total: data.total
        });
      } else {
        console.error("API Error: invalid seller orders response");
        message.error("Failed to fetch orders");
        setOrders([]); // Set empty array on error
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message === "AbortError") {
        message.error("Request timeout - please try again");
      } else {
        console.error("Error fetching orders:", error);
        message.error("Error fetching orders");
      }
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchSellerOrders(1, searchText, statusFilter);
  };

  const handleTableChange = (newPagination) => {
    fetchSellerOrders(newPagination.current, searchText, statusFilter);
  };

  const getStatusColor = (status) => {
    const colors = {
      "pending": "orange",
      "confirmed": "blue",
      "dispatched": "cyan",
      "delivered": "green",
      "cancelled": "red"
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => <span className="font-weight-bold">{id.slice(-8)}</span>,
      width: 100
    },
    {
      title: "Plant Name",
      dataIndex: ["orderItems", "0", "plantName"],
      key: "plantName",
      render: (text, record) => {
        const plants = record.orderItems.map(item => item.plantName).join(", ");
        return plants;
      }
    },
    {
      title: "Quantity",
      dataIndex: ["orderItems", "0", "quantity"],
      key: "quantity",
      render: (text, record) => {
        const totalQty = record.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        return totalQty;
      },
      width: 80
    },
    {
      title: "Status",
      dataIndex: ["orderItems", "0", "orderStatus", "status"],
      key: "status",
      render: (text, record) => {
        const status = record.orderItems[0]?.orderStatus?.status || "pending";
        return <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>;
      },
      width: 120
    },
    {
      title: "Price",
      dataIndex: ["orderItems", "0", "price"],
      key: "price",
      render: (text, record) => {
        const totalPrice = record.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return `₹${totalPrice.toFixed(2)}`;
      },
      width: 100
    },
    {
      title: "Customer",
      dataIndex: ["user", "firstName"],
      key: "customer",
      render: (text, record) => `${record.user?.firstName || ""} ${record.user?.lastName || ""}`,
      width: 150
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/nursery/orders/track`)}
          >
            View
          </Button>
        </Space>
      ),
      width: 100
    }
  ];

  return (
    <div className="nursery-order-container">
      <div className="nursery-sidebar">
        <ProfileSideNav />
      </div>
      <div className="nursery-order-content">
        <h2>Manage Your Orders</h2>

        {/* Search and Filter Section */}
        <Card className="search-card" style={{ marginBottom: "20px" }}>
          <div className="search-filter-container">
            <Input
              placeholder="Search by Order ID or Plant Name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: "300px", marginRight: "10px" }}
            />
            <Select
              placeholder="Filter by Status"
              style={{ width: "200px", marginRight: "10px" }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={[
                { label: "Pending", value: "pending" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Dispatched", value: "dispatched" },
                { label: "Delivered", value: "delivered" },
                { label: "Cancelled", value: "cancelled" }
              ]}
            />
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </Card>

        {/* Orders Table */}
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Loading orders..." />
          </div>
        ) : orders.length === 0 ? (
          <Empty
            description="No orders received yet"
            style={{ marginTop: "50px" }}
            extra={
              <Button type="primary" onClick={() => navigate("/nursery/plants")}>
                Add Plants to Your Nursery
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="_id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
          />
        )}
      </div>
    </div>
  );
};

export default NurseryOrder;
