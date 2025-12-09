import { SavedMapping } from '@/components/PastMappings';

const API_BASE_URL = 'http://localhost:5000/api';

export const saveMappingToBackend = async (mapping: SavedMapping): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mappings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapping),
    });

    if (!response.ok) {
      throw new Error('Failed to save mapping');
    }
  } catch (error) {
    console.error('Failed to save mapping:', error);
    throw error;
  }
};

export const getMappingsFromBackend = async (): Promise<SavedMapping[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mappings`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch mappings');
    }

    const data = await response.json();
    // console.log('Fetched mappings:', data);
    return data;
  } catch (error) {
    console.error('Failed to load mappings:', error);
    return [];
  }
};

export const updateMappingInBackend = async (
  id: string,
  updatedMapping: SavedMapping
): Promise<void> => {
  console.log('Updating mapping with ID:', id, 'Updated Data:', updatedMapping);
  try {
    const response = await fetch(`${API_BASE_URL}/mappings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedMapping),
    });

    if (!response.ok) {
      throw new Error('Failed to update mapping');
    }
  } catch (error) {
    console.error('Failed to update mapping:', error);
    throw error;
  }
};

export const deleteMappingFromBackend = async (id: string): Promise<void> => {
  // Show confirmation dialog
  const confirmed = window.confirm('Are you sure you want to delete this mapping? This action cannot be undone.');
  
  if (!confirmed) {
    return; // User cancelled
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/mappings/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete mapping');
    }
  } catch (error) {
    console.error('Failed to delete mapping:', error);
    throw error;
  }
};