import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button type="primary" className="bg-blue-500 hover:bg-blue-600">
              <Link to="/">Go to Login</Link>
            </Button>
            <Button>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        }
        className="bg-white shadow-lg rounded-lg p-8"
      />
    </div>
  );
};

export default NotFound;