import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductAsync, resetProduct } from '../features/products/productsSlice';
import ProductImages from '../features/products/Components/ProductImages';
import ProductInfo from '../features/products/Components/ProductInfo';
import ProductSummary from '../features/products/Components/ProductSummary';
import NoDataFound from '../features/common/NoDataFound';
import Animation from '../features/common/Animation';

const ProductPage = () => {
  const product = useSelector(state => state.products.product);
  const isLoading = useSelector(state => state.products.isLoading);
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = product ? product.plantName : "Plant info";
  }, [product]);

  useEffect(() => {
    dispatch(resetProduct());
    dispatch(getProductAsync(id));
  }, [id, dispatch]);

  if (isLoading) {
    return <Animation />;
  }

  return (
    <>
      {
        product ?
          <div className='container mt-3 p-2 bg-light'>
            <div className="row">
              <ProductImages />
              <ProductInfo />
              <ProductSummary />
            </div>
          </div >
          :
          <NoDataFound link="/products" message="Back To Products" />
      }
    </>
  )
}

export default ProductPage