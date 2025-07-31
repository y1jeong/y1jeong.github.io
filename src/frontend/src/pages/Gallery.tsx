import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  Eye, 
  Edit, 
  Download, 
  Share, 
  Trash2, 
  Star, 
  StarOff, 
  Calendar, 
  User, 
  MoreVertical,
  Copy,
  FolderOpen,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Design {
  id: string;
  name: string;
  description?: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  isPublic: boolean;
  isFavorite: boolean;
  dimensions: {
    width: number;
    height: number;
    thickness: number;
  };
  material: string;
  patternCount: number;
  downloadCount: number;
  likeCount: number;
}

interface GalleryFilters {
  search: string;
  sortBy: 'name' | 'date' | 'popularity' | 'author';
  sortOrder: 'asc' | 'desc';
  filterBy: 'all' | 'mine' | 'favorites' | 'public' | 'shared';
  tags: string[];
  material: string;
}

type ViewMode = 'grid' | 'list';

// Mock data for demonstration
const mockDesigns: Design[] = [
  {
    id: '1',
    name: 'Modern Acoustic Panel',
    description: 'Contemporary perforated design for acoustic treatment',
    thumbnail: '/api/placeholder/300/200',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    author: {
      id: 'user1',
      name: 'John Doe',
      avatar: '/api/placeholder/32/32'
    },
    tags: ['acoustic', 'modern', 'interior'],
    isPublic: true,
    isFavorite: true,
    dimensions: { width: 1200, height: 800, thickness: 3 },
    material: 'Aluminum',
    patternCount: 156,
    downloadCount: 23,
    likeCount: 12
  },
  {
    id: '2',
    name: 'Geometric Facade',
    description: 'Bold geometric pattern for building exteriors',
    thumbnail: '/api/placeholder/300/200',
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    author: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: '/api/placeholder/32/32'
    },
    tags: ['geometric', 'facade', 'architecture'],
    isPublic: true,
    isFavorite: false,
    dimensions: { width: 2000, height: 1500, thickness: 5 },
    material: 'Steel',
    patternCount: 89,
    downloadCount: 45,
    likeCount: 28
  },
  {
    id: '3',
    name: 'Organic Flow Pattern',
    description: 'Nature-inspired flowing perforations',
    thumbnail: '/api/placeholder/300/200',
    createdAt: '2024-01-08T14:22:00Z',
    updatedAt: '2024-01-08T14:22:00Z',
    author: {
      id: 'user1',
      name: 'John Doe',
      avatar: '/api/placeholder/32/32'
    },
    tags: ['organic', 'nature', 'artistic'],
    isPublic: false,
    isFavorite: true,
    dimensions: { width: 1000, height: 600, thickness: 2 },
    material: 'Brass',
    patternCount: 234,
    downloadCount: 8,
    likeCount: 5
  },
  {
    id: '4',
    name: 'Minimalist Grid',
    description: 'Clean and simple grid-based design',
    thumbnail: '/api/placeholder/300/200',
    createdAt: '2024-01-05T11:30:00Z',
    updatedAt: '2024-01-07T09:15:00Z',
    author: {
      id: 'user3',
      name: 'Mike Johnson',
      avatar: '/api/placeholder/32/32'
    },
    tags: ['minimalist', 'grid', 'clean'],
    isPublic: true,
    isFavorite: false,
    dimensions: { width: 800, height: 800, thickness: 4 },
    material: 'Stainless Steel',
    patternCount: 64,
    downloadCount: 67,
    likeCount: 34
  }
];

const MATERIALS = ['All', 'Aluminum', 'Steel', 'Stainless Steel', 'Brass', 'Copper', 'Plastic', 'Wood'];
const POPULAR_TAGS = ['acoustic', 'geometric', 'modern', 'minimalist', 'organic', 'facade', 'interior', 'artistic'];

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [designs, setDesigns] = useState<Design[]>(mockDesigns);
  const [filteredDesigns, setFilteredDesigns] = useState<Design[]>(mockDesigns);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDesigns] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<GalleryFilters>({
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
    filterBy: 'all',
    tags: [],
    material: 'All'
  });

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...designs];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(design => 
        design.name.toLowerCase().includes(searchLower) ||
        design.description?.toLowerCase().includes(searchLower) ||
        design.author.name.toLowerCase().includes(searchLower) ||
        design.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    switch (filters.filterBy) {
      case 'mine':
        filtered = filtered.filter(design => design.author.id === user?.id);
        break;
      case 'favorites':
        filtered = filtered.filter(design => design.isFavorite);
        break;
      case 'public':
        filtered = filtered.filter(design => design.isPublic);
        break;
      case 'shared':
        filtered = filtered.filter(design => design.author.id !== user?.id && design.isPublic);
        break;
    }

    // Material filter
    if (filters.material !== 'All') {
      filtered = filtered.filter(design => design.material === filters.material);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(design => 
        filters.tags.some(tag => design.tags.includes(tag))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'popularity':
          comparison = (a.downloadCount + a.likeCount) - (b.downloadCount + b.likeCount);
          break;
        case 'author':
          comparison = a.author.name.localeCompare(b.author.name);
          break;
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDesigns(filtered);
  }, [designs, filters, user?.id]);

  const handleFilterChange = (key: keyof GalleryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleDesignAction = async (action: string, designId: string) => {
    const design = designs.find(d => d.id === designId);
    if (!design) return;

    switch (action) {
      case 'view':
        // Open design in view-only mode
        navigate(`/design/${designId}?mode=view`);
        break;
      case 'edit':
        navigate(`/design/${designId}`);
        break;
      case 'duplicate':
        try {
          const duplicatedDesign = {
            ...design,
            id: `${design.id}_copy_${Date.now()}`,
            name: `${design.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            downloadCount: 0,
            likeCount: 0,
            isFavorite: false
          };
          
          setDesigns(prev => [duplicatedDesign, ...prev]);
          
          // Show success message
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
          successDiv.textContent = 'Design duplicated successfully!';
          document.body.appendChild(successDiv);
          setTimeout(() => document.body.removeChild(successDiv), 3000);
        } catch (error) {
          console.error('Failed to duplicate design:', error);
          alert('Failed to duplicate design. Please try again.');
        }
        break;
      case 'download':
        try {
          const exportData = {
            version: '1.0',
            design: {
              name: design.name,
              description: design.description,
              dimensions: design.dimensions,
              material: design.material,
              tags: design.tags,
              patternCount: design.patternCount
            },
            metadata: {
              exportedAt: new Date().toISOString(),
              originalId: design.id
            }
          };
          
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          });
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${design.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Update download count
          setDesigns(prev => prev.map(d => 
            d.id === designId 
              ? { ...d, downloadCount: d.downloadCount + 1 }
              : d
          ));
          
          // Show success message
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
          successDiv.textContent = 'Design downloaded successfully!';
          document.body.appendChild(successDiv);
          setTimeout(() => document.body.removeChild(successDiv), 3000);
        } catch (error) {
          console.error('Failed to download design:', error);
          alert('Failed to download design. Please try again.');
        }
        break;
      case 'share':
        try {
          const shareUrl = `${window.location.origin}/design/${designId}?mode=view`;
          
          if (navigator.share) {
            // Use native sharing if available
            await navigator.share({
              title: design.name,
              text: design.description || 'Check out this perforated wall design',
              url: shareUrl
            });
          } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(shareUrl);
            
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg z-50';
            successDiv.textContent = 'Share link copied to clipboard!';
            document.body.appendChild(successDiv);
            setTimeout(() => document.body.removeChild(successDiv), 3000);
          }
        } catch (error) {
          console.error('Failed to share design:', error);
          alert('Failed to share design. Please try again.');
        }
        break;
      case 'favorite':
        setDesigns(prev => prev.map(design => 
          design.id === designId 
            ? { ...design, isFavorite: !design.isFavorite }
            : design
        ));
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this design?')) {
          setDesigns(prev => prev.filter(design => design.id !== designId));
        }
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const DesignCard: React.FC<{ design: Design }> = ({ design }) => {
    const [showActions, setShowActions] = useState(false);
    const isOwner = design.author.id === user?.id;

    return (
      <Card 
        className={cn(
          'group cursor-pointer transition-all hover:shadow-lg',
          selectedDesigns.includes(design.id) && 'ring-2 ring-primary'
        )}
        onClick={() => handleDesignAction('view', design.id)}
      >
        <div className="relative">
          <img
            src={design.thumbnail}
            alt={design.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDesignAction('view', design.id);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDesignAction('edit', design.id);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleDesignAction('download', design.id);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Favorite button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              handleDesignAction('favorite', design.id);
            }}
          >
            {design.isFavorite ? (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          
          {/* Privacy indicator */}
          {!design.isPublic && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              Private
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg truncate">{design.name}</h3>
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-white border rounded-md shadow-lg z-10 min-w-[120px]">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDesignAction('duplicate', design.id);
                      setShowActions(false);
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDesignAction('share', design.id);
                      setShowActions(false);
                    }}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </button>
                  {isOwner && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDesignAction('delete', design.id);
                        setShowActions(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {design.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {design.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {design.author.name}
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(design.updatedAt)}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {design.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {design.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{design.tags.length - 3}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{design.patternCount} patterns</span>
            <div className="flex items-center space-x-3">
              <span>{design.downloadCount} downloads</span>
              <span>{design.likeCount} likes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Design Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Discover and manage your perforated wall designs
          </p>
        </div>
        
        <Link to="/design">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Design
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designs, authors, or tags..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={filters.filterBy}
                  onChange={(e) => handleFilterChange('filterBy', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Designs</option>
                  <option value="mine">My Designs</option>
                  <option value="favorites">Favorites</option>
                  <option value="public">Public</option>
                  <option value="shared">Shared with Me</option>
                </select>
              </div>
              
              {/* Sort by */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <div className="flex">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 p-2 border rounded-l-md"
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="popularity">Popularity</option>
                    <option value="author">Author</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="rounded-l-none"
                  >
                    {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Material filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Material</label>
                <select
                  value={filters.material}
                  onChange={(e) => handleFilterChange('material', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {MATERIALS.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
              </div>
              
              {/* Tags filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={cn(
                        'text-xs px-2 py-1 rounded border transition-colors',
                        filters.tags.includes(tag)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-secondary'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredDesigns.length} of {designs.length} designs
        </p>
        
        {selectedDesigns.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{selectedDesigns.length} selected</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </Button>
          </div>
        )}
      </div>

      {/* Designs grid/list */}
      {filteredDesigns.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No designs found</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.filterBy !== 'all' || filters.tags.length > 0
              ? 'Try adjusting your search criteria or filters'
              : 'Start creating your first design'}
          </p>
          <Link to="/design">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Design
            </Button>
          </Link>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          {filteredDesigns.map(design => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      )}
    </div>
  );
};