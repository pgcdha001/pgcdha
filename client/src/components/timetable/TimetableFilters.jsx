import React from 'react';
import { Filter, Search, X, Calendar, User, School, MapPin, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

const TimetableFilters = ({ 
  filters, 
  onFiltersChange, 
  classes, 
  teachers, 
  onApplyFilters, 
  onClearFilters 
}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const floors = [
    { value: '1', label: '1st Floor - 11th Boys' },
    { value: '2', label: '2nd Floor - 12th Boys' },
    { value: '3', label: '3rd Floor - 11th Girls' },
    { value: '4', label: '4th Floor - 12th Girls' }
  ];

  const lectureTypes = ['Theory', 'Practical', 'Tutorial', 'Lab'];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== '' && value !== 'all').length;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      classId: 'all',
      teacherId: 'all',
      dayOfWeek: 'all',
      floor: 'all',
      lectureType: 'all',
      subject: ''
    });
    onClearFilters();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFiltersCount()} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by subject, teacher, or class..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Primary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Class Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Class</label>
            <Select 
              value={filters.classId} 
              onValueChange={(value) => handleFilterChange('classId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls._id} value={cls._id}>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4" />
                      <span>{cls.name} - {cls.grade} {cls.campus}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teacher</label>
            <Select 
              value={filters.teacherId} 
              onValueChange={(value) => handleFilterChange('teacherId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers.map(teacher => (
                  <SelectItem key={teacher._id} value={teacher._id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{`${teacher.fullName?.firstName || ''} ${teacher.fullName?.lastName || ''}`.trim() || teacher.name || teacher.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Day</label>
            <Select 
              value={filters.dayOfWeek} 
              onValueChange={(value) => handleFilterChange('dayOfWeek', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {days.map(day => (
                  <SelectItem key={day} value={day}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {day}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Floor Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Floor</label>
            <Select 
              value={filters.floor} 
              onValueChange={(value) => handleFilterChange('floor', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Floors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map(floor => (
                  <SelectItem key={floor.value} value={floor.value}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {floor.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lecture Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Lecture Type</label>
            <Select 
              value={filters.lectureType} 
              onValueChange={(value) => handleFilterChange('lectureType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {lectureTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {type}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject</label>
            <Input
              placeholder="Enter subject name..."
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={onApplyFilters} className="flex-1 min-w-[120px]">
            Apply Filters
          </Button>
          <Button 
            variant="outline" 
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Active Filters:</label>
            <div className="flex flex-wrap gap-2">
              {filters.classId && filters.classId !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <School className="h-3 w-3" />
                  Class: {classes.find(c => c._id === filters.classId)?.name || 'Unknown'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('classId', 'all')}
                  />
                </Badge>
              )}
              {filters.teacherId && filters.teacherId !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Teacher: {teachers.find(t => t._id === filters.teacherId)?.fullName || 'Unknown'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('teacherId', 'all')}
                  />
                </Badge>
              )}
              {filters.dayOfWeek && filters.dayOfWeek !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Day: {filters.dayOfWeek}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('dayOfWeek', 'all')}
                  />
                </Badge>
              )}
              {filters.floor && filters.floor !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Floor: {floors.find(f => f.value === filters.floor)?.label || 'Unknown'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('floor', 'all')}
                  />
                </Badge>
              )}
              {filters.lectureType && filters.lectureType !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Type: {filters.lectureType}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('lectureType', 'all')}
                  />
                </Badge>
              )}
              {filters.subject && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Subject: {filters.subject}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('subject', '')}
                  />
                </Badge>
              )}
              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Search: {filters.searchTerm}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('searchTerm', '')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableFilters;
