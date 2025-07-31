import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Clock, Server, Database, Zap, Globe, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  uptime: string;
  responseTime: string;
  lastChecked: string;
  icon: React.ReactNode;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  startTime: string;
  description: string;
  updates: {
    time: string;
    message: string;
    status: string;
  }[];
}

export function Status() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Web Application',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '245ms',
      lastChecked: '2 minutes ago',
      icon: <Globe className="h-5 w-5" />
    },
    {
      name: 'API Services',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '180ms',
      lastChecked: '1 minute ago',
      icon: <Server className="h-5 w-5" />
    },
    {
      name: 'Database',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '45ms',
      lastChecked: '30 seconds ago',
      icon: <Database className="h-5 w-5" />
    },
    {
      name: 'Image Processing',
      status: 'operational',
      uptime: '99.92%',
      responseTime: '1.2s',
      lastChecked: '1 minute ago',
      icon: <Zap className="h-5 w-5" />
    },
    {
      name: 'File Export',
      status: 'operational',
      uptime: '99.96%',
      responseTime: '890ms',
      lastChecked: '2 minutes ago',
      icon: <Shield className="h-5 w-5" />
    }
  ]);

  const incidents: Incident[] = [
    {
      id: '1',
      title: 'Scheduled Maintenance - Database Optimization',
      status: 'resolved',
      severity: 'minor',
      startTime: '2024-12-24 02:00 UTC',
      description: 'Scheduled maintenance to optimize database performance and apply security updates.',
      updates: [
        {
          time: '2024-12-24 04:30 UTC',
          message: 'Maintenance completed successfully. All services are fully operational.',
          status: 'resolved'
        },
        {
          time: '2024-12-24 02:00 UTC',
          message: 'Maintenance window started. Some services may experience brief interruptions.',
          status: 'monitoring'
        }
      ]
    }
  ];

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // Simulate real-time updates
      setServices(prev => prev.map(service => ({
        ...service,
        lastChecked: Math.random() > 0.5 ? '30 seconds ago' : '1 minute ago'
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'outage':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'major':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'minor':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const overallStatus = services.every(s => s.status === 'operational') ? 'operational' : 
                       services.some(s => s.status === 'outage') ? 'outage' : 'degraded';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            System Status
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Current status and uptime information for all RhinoPerforatedWall services.
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                {getStatusIcon(overallStatus)}
                <span className="ml-2">Overall System Status</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(overallStatus)}`}>
                {overallStatus === 'operational' ? 'All Systems Operational' :
                 overallStatus === 'degraded' ? 'Some Systems Degraded' : 'System Outage'}
              </span>
            </CardTitle>
            <CardDescription>
              Last updated: {lastUpdated.toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.97%</div>
                <div className="text-sm text-gray-500">30-day uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">245ms</div>
                <div className="text-sm text-gray-500">Avg response time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-sm text-gray-500">Active services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-500">Active incidents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>
              Real-time status of individual services and components.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-500">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{service.name}</h3>
                      <p className="text-sm text-gray-500">Last checked: {service.lastChecked}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{service.uptime}</div>
                      <div className="text-xs text-gray-500">Uptime</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{service.responseTime}</div>
                      <div className="text-xs text-gray-500">Response</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(service.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>
              Past incidents and maintenance activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recent Incidents</h3>
                <p className="text-gray-500">All systems have been running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{incident.title}</h3>
                        <p className="text-sm text-gray-500">{incident.startTime}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{incident.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">Updates:</h4>
                      {incident.updates.map((update, updateIndex) => (
                        <div key={updateIndex} className="flex items-start space-x-3 text-sm">
                          <div className="text-gray-500 mt-0.5">
                            <Clock className="h-3 w-3" />
                          </div>
                          <div>
                            <div className="text-gray-500">{update.time}</div>
                            <div className="text-gray-600 dark:text-gray-300">{update.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscribe to Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Stay Informed</CardTitle>
            <CardDescription>
              Get notified about service updates and incidents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link to="/contact">Subscribe to Updates</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/help">Report an Issue</Link>
              </Button>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>You can also follow us on social media for real-time updates during incidents.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}