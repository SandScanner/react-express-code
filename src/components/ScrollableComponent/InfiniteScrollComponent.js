import React, { useEffect, useState } from "react";
import axios from "../../interceptor/interceptor";
import "chartjs-adapter-moment";

import Loader from "../../utils/loader/Loader";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "react-toastify";

const InfiniteScrollComponent = () => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    await axios
      .post("/getReadingsPagination/", {
        limit: 100,
        offset: chartData.length === 0 ? 0 : chartData.length,
      })
      .then((res) => setChartData([...chartData, ...res.data]))
      .catch((e) => {
        toast.error("something went wrong");
      });
  };

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      await fetchData();
      setIsLoading(false);
    })();
  }, []);

  console.log("chart data", chartData);

  return (
    <div className="container">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="infinite-container chart-container" id="scrollableDiv">
          <h3 className="m-4">Sensor Data</h3>
          <InfiniteScroll
            dataLength={chartData.length}
            next={fetchData}
            hasMore={true} // Replace with a condition based on your data source
            loader={<p>Loading...</p>}
            endMessage={<p>No more data to load.</p>}
            scrollableTarget="scrollableDiv"
          >
            <table class="table table-dark">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Time</th>
                  <th scope="col">Sensor Id</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>

              <tbody>
                {chartData.map((x, i) => (
                  <tr>
                    <th scope="row" key={i}>
                      {i}
                    </th>
                    <td>{x._time}</td>
                    <td>{x.sensor_id}</td>
                    <td>{x._value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InfiniteScroll>
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollComponent;
