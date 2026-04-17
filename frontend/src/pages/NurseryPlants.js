import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserData from "../hooks/useUserData";
import ProfileSideNav from "../features/user/Components/ProfileSideNav";
import { Button, Table, Space, Empty, Spin, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import "./styles/NurseryPlants.scss";

const NurseryPlants = () => {
  const navigate = useNavigate();
  const { userData: user, isLoading: isUserLoading } = useUserData();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    if (user && !user.role.includes("seller")) {
      message.warning("You need to create a nursery first to manage plants.");
      setTimeout(() => navigate("/nursery/create"), 1500);
      return;
    }
    if (user && user.role.includes("seller")) {
      fetchPlants();
    }
  }, [user, isUserLoading, navigate]);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v2/nursery/plants", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setPlants(data.data || []);
      } else {
        message.error("Failed to fetch plants");
      }
    } catch (error) {
      console.error("Error fetching plants:", error);
      message.error("Error fetching plants");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/nursery/plant/update/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      const response = await fetch(`/api/v2/nursery/plants/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        message.success("Plant deleted successfully");
        fetchPlants();
      } else {
        message.error("Failed to delete plant");
      }
    } catch (error) {
      console.error("Error deleting plant:", error);
      message.error("Error deleting plant");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Plant Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `₹${price}`,
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "stock",
      render: (qty) => <span className={qty > 0 ? "in-stock" : "out-of-stock"}>{qty}</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record._id)}
          >
            Edit
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={deletingId === record._id}
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="nursery-plants-container">
      <div className="nursery-sidebar">
        <ProfileSideNav />
      </div>
      <div className="nursery-plants-content">
        <div className="plants-header">
          <h2>My Plants</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/nursery/plant/new")}
          >
            Add New Plant
          </Button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip="Loading plants..." />
          </div>
        ) : plants.length === 0 ? (
          <Empty
            description="No plants added yet"
            style={{ marginTop: "50px" }}
            extra={
              <Button
                type="primary"
                onClick={() => navigate("/nursery/plant/new")}
              >
                Add First Plant
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={plants}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} plants`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default NurseryPlants;
