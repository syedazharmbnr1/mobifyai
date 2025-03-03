// preview-service/renderers/reactNativePreviewRenderer.ts

import fs from 'fs';
import path from 'path';
import { PreviewRenderer, PreviewOptions, PreviewResult } from './previewRenderer';
import { Logger } from '../utils/logger';

const logger = new Logger('ReactNativePreviewRenderer');

export class ReactNativePreviewRenderer extends PreviewRenderer {
  /**
   * Generate React Native preview for a mobile app
   */
  async generatePreview(options: PreviewOptions): Promise<PreviewResult> {
    const { projectId, previewId, previewDir, appSpec, uiDesignSystem } = options;
    
    try {
      // Create necessary directories
      const srcDir = path.join(previewDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      const screensDir = path.join(srcDir, 'screens');
      const navigationDir = path.join(srcDir, 'navigation');
      const themesDir = path.join(srcDir, 'themes');
      const utilsDir = path.join(srcDir, 'utils');
      const mockDataDir = path.join(srcDir, 'mock-data');
      const assetsDir = path.join(previewDir, 'assets');
      
      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(componentsDir, { recursive: true });
      fs.mkdirSync(screensDir, { recursive: true });
      fs.mkdirSync(navigationDir, { recursive: true });
      fs.mkdirSync(themesDir, { recursive: true });
      fs.mkdirSync(utilsDir, { recursive: true });
      fs.mkdirSync(mockDataDir, { recursive: true });
      fs.mkdirSync(assetsDir, { recursive: true });
      
      // Generate theme
      const theme = this.generateTheme(uiDesignSystem.designSystem);
      fs.writeFileSync(path.join(themesDir, 'theme.js'), theme);
      
      // Generate mock data
      const mockData = this.generateMockData(appSpec.dataModels);
      fs.writeFileSync(path.join(mockDataDir, 'mockData.js'), mockData);
      
      // Generate components
      const generatedComponents: string[] = [];
      if (uiDesignSystem.components) {
        for (const componentType in uiDesignSystem.components) {
          const componentCode = this.generateComponent(
            componentType, 
            uiDesignSystem.components[componentType],
            uiDesignSystem.designSystem
          );
          
          const componentFileName = `${this.capitalizeFirstLetter(componentType)}.js`;
          fs.writeFileSync(path.join(componentsDir, componentFileName), componentCode);
          generatedComponents.push(componentFileName);
        }
      }
      
      // Generate screens
      const generatedScreens: string[] = [];
      for (const screen of appSpec.screens) {
        const screenCode = this.generateScreen(
          screen,
          screen.components,
          uiDesignSystem.designSystem
        );
        
        const screenFileName = `${screen.name.replace(/\s+/g, '')}Screen.js`;
        fs.writeFileSync(path.join(screensDir, screenFileName), screenCode);
        generatedScreens.push(screenFileName);
      }
      
      // Generate navigation
      const navigation = this.generateNavigation(appSpec.screens, uiDesignSystem.designSystem);
      fs.writeFileSync(path.join(navigationDir, 'AppNavigator.js'), navigation);
      
      // Generate utility files
      const apiUtils = this.generateApiUtils(appSpec.apiEndpoints);
      fs.writeFileSync(path.join(utilsDir, 'api.js'), apiUtils);
      
      const authUtils = this.generateAuthUtils(appSpec.authentication);
      fs.writeFileSync(path.join(utilsDir, 'auth.js'), authUtils);
      
      // Generate main App.js
      const appJs = this.generateAppJs();
      fs.writeFileSync(path.join(srcDir, 'App.js'), appJs);
      
      // Generate index.js (entry point)
      const indexJs = this.generateIndexJs();
      fs.writeFileSync(path.join(previewDir, 'index.js'), indexJs);
      
      // Generate package.json
      const packageJson = this.generatePackageJson(appSpec.appName);
      fs.writeFileSync(path.join(previewDir, 'package.json'), packageJson);
      
      // Generate preview HTML file
      const previewHtml = this.generatePreviewHtml(appSpec, uiDesignSystem);
      fs.writeFileSync(path.join(previewDir, 'index.html'), previewHtml);
      
      // Return preview result
      return {
        entryFile: 'index.html',
        assets: [],
        screens: generatedScreens,
      };
    } catch (error) {
      logger.error('Error generating React Native preview', error);
      throw error;
    }
  }
  
  /**
   * Generate component code
   */
  generateComponent(componentType: string, props: any, theme: any): string {
    // Component templates based on type
    switch (componentType) {
      case 'buttons':
        return this.generateButtonComponent(props, theme);
      case 'inputs':
        return this.generateInputComponent(props, theme);
      case 'cards':
        return this.generateCardComponent(props, theme);
      case 'lists':
        return this.generateListComponent(props, theme);
      case 'navigation':
        return this.generateNavigationComponent(props, theme);
      case 'dialogs':
        return this.generateDialogComponent(props, theme);
      default:
        return this.generateGenericComponent(componentType, props, theme);
    }
  }
  
  /**
   * Generate screen code
   */
  generateScreen(screen: any, components: any[], theme: any): string {
    const screenName = screen.name.replace(/\s+/g, '');
    
    // Import statements
    let imports = `
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
`;

    // Import components used in this screen
    const usedComponentTypes = new Set<string>();
    if (components) {
      components.forEach(component => {
        usedComponentTypes.add(this.mapComponentTypeToImport(component.type));
      });
    }
    
    usedComponentTypes.forEach(componentType => {
      imports += `import ${componentType} from '../components/${componentType}';\n`;
    });
    
    // Screen component implementation
    const screenCode = `
${imports}

const ${screenName}Screen = ({ navigation, route }) => {
  const { theme } = useTheme();
  
  // Screen state
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  
  // Fetch data on mount
  useEffect(() => {
    // Simulated data fetching
    setIsLoading(true);
    setTimeout(() => {
      setData([
        { id: 1, title: 'Sample Item 1', description: 'Description for sample item 1' },
        { id: 2, title: 'Sample Item 2', description: 'Description for sample item 2' },
        { id: 3, title: 'Sample Item 3', description: 'Description for sample item 3' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  // Render screen content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            ${screen.name}
          </Text>
          ${screen.description ? `<Text style={[styles.description, { color: theme.colors.text.secondary }]}>
            ${screen.description}
          </Text>` : ''}
        </View>
        
        <View style={styles.content}>
          ${this.generateScreenComponents(components, theme)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
});

export default ${screenName}Screen;
`;
    
    return screenCode;
  }
  
  /**
   * Generate screen components based on component list
   */
  private generateScreenComponents(components: any[], theme: any): string {
    if (!components || components.length === 0) {
      return `
        <Text>No components to display</Text>
      `;
    }
    
    let componentsCode = '';
    
    components.forEach((component, index) => {
      switch (component.type) {
        case 'button':
          componentsCode += `
          <Button 
            title="${component.properties?.title || 'Button'}"
            onPress={() => console.log('Button pressed')}
            type="${component.properties?.variant || 'primary'}"
            style={{ marginBottom: 16 }}
          />`;
          break;
        case 'textfield':
          componentsCode += `
          <Input
            label="${component.properties?.label || 'Input'}"
            placeholder="${component.properties?.placeholder || 'Enter text...'}"
            onChangeText={(text) => console.log(text)}
            style={{ marginBottom: 16 }}
          />`;
          break;
        case 'list':
          componentsCode += `
          {isLoading ? (
            <Text>Loading...</Text>
          ) : (
            <View style={{ marginBottom: 16 }}>
              {data.map((item) => (
                <ListItem
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  onPress={() => console.log('Item pressed', item)}
                />
              ))}
            </View>
          )}`;
          break;
        case 'card':
          componentsCode += `
          <Card
            title="${component.properties?.title || 'Card Title'}"
            content="${component.properties?.content || 'Card content goes here...'}"
            style={{ marginBottom: 16 }}
          />`;
          break;
        default:
          componentsCode += `
          <View style={{ marginBottom: 16 }}>
            <Text>Component: ${component.type}</Text>
          </View>`;
      }
    });
    
    return componentsCode;
  }
  
  /**
   * Generate navigation code
   */
  generateNavigation(screens: any[], theme: any): string {
    const imports = `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../themes/ThemeContext';
${screens.map(screen => {
  const screenName = screen.name.replace(/\s+/g, '');
  return `import ${screenName}Screen from '../screens/${screenName}Screen';`;
}).join('\n')}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
`;

    // Group screens by navigation type (tab, stack, etc.)
    const mainScreens = screens.filter(screen => !screen.route?.includes('/'));
    const nestedScreens = screens.filter(screen => screen.route?.includes('/'));
    
    // Create stack navigators for nested screens grouped by base route
    const nestedRoutes = new Map<string, any[]>();
    nestedScreens.forEach(screen => {
      const [baseRoute] = screen.route.split('/');
      if (!nestedRoutes.has(baseRoute)) {
        nestedRoutes.set(baseRoute, []);
      }
      nestedRoutes.get(baseRoute)?.push(screen);
    });
    
    let stackNavigators = '';
    nestedRoutes.forEach((routeScreens, baseRoute) => {
      const navigatorName = `${this.capitalizeFirstLetter(baseRoute)}Stack`;
      
      stackNavigators += `
const ${navigatorName} = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      ${routeScreens.map(screen => {
        const screenName = screen.name.replace(/\s+/g, '');
        return `<Stack.Screen name="${screenName}" component={${screenName}Screen} />`;
      }).join('\n      ')}
    </Stack.Navigator>
  );
};
`;
    });
    
    // Main tab navigator
    const mainNavigator = `
const AppNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text.secondary,
          tabBarStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        ${mainScreens.map(screen => {
          const screenName = screen.name.replace(/\s+/g, '');
          return `<Tab.Screen name="${screenName}" component={${screenName}Screen} />`;
        }).join('\n        ')}
        ${Array.from(nestedRoutes.keys()).map(baseRoute => {
          const navigatorName = `${this.capitalizeFirstLetter(baseRoute)}Stack`;
          return `<Tab.Screen name="${baseRoute}" component={${navigatorName}} />`;
        }).join('\n        ')}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
`;

    return `${imports}\n${stackNavigators}\n${mainNavigator}`;
  }
  
  /**
   * Generate theme code
   */
  generateTheme(designSystem: any): string {
    const themeCode = `
import React, { createContext, useContext, useState } from 'react';

// Default theme based on design system
const defaultTheme = {
  colors: {
    primary: '${designSystem.colorPalette?.primary || '#007BFF'}',
    secondary: '${designSystem.colorPalette?.secondary || '#6C757D'}',
    accent: '${designSystem.colorPalette?.accent || '#FFC107'}',
    background: '${designSystem.colorPalette?.background || '#FFFFFF'}',
    surface: '${designSystem.colorPalette?.surface || '#F8F9FA'}',
    error: '${designSystem.colorPalette?.error || '#DC3545'}',
    text: {
      primary: '${designSystem.colorPalette?.text?.primary || '#212529'}',
      secondary: '${designSystem.colorPalette?.text?.secondary || '#6C757D'}',
      hint: '${designSystem.colorPalette?.text?.hint || '#ADB5BD'}',
    },
  },
  typography: {
    fontFamily: '${designSystem.typography?.fontFamily || 'System'}',
    fontSize: {
      h1: ${parseInt(designSystem.typography?.heading1?.fontSize) || 28},
      h2: ${parseInt(designSystem.typography?.heading2?.fontSize) || 24},
      body: ${parseInt(designSystem.typography?.body?.fontSize) || 16},
      caption: ${parseInt(designSystem.typography?.caption?.fontSize) || 12},
      button: ${parseInt(designSystem.typography?.button?.fontSize) || 16},
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
  },
  spacing: {
    xs: ${parseInt(designSystem.spacing?.xs) || 4},
    sm: ${parseInt(designSystem.spacing?.sm) || 8},
    md: ${parseInt(designSystem.spacing?.md) || 16},
    lg: ${parseInt(designSystem.spacing?.lg) || 24},
    xl: ${parseInt(designSystem.spacing?.xl) || 32},
  },
  borderRadius: {
    small: ${parseInt(designSystem.borderRadius?.small) || 4},
    medium: ${parseInt(designSystem.borderRadius?.medium) || 8},
    large: ${parseInt(designSystem.borderRadius?.large) || 12},
    pill: ${parseInt(designSystem.borderRadius?.pill) || 9999},
  },
  shadows: {
    small: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    medium: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    large: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
  },
};

// Create theme context
const ThemeContext = createContext({
  theme: defaultTheme,
  toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Dark theme based on light theme
  const darkTheme = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      background: '#121212',
      surface: '#1E1E1E',
      text: {
        primary: '#FFFFFF',
        secondary: '#B0B0B0',
        hint: '#7B7B7B',
      },
    },
  };
  
  const theme = isDarkMode ? darkTheme : defaultTheme;
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

export default defaultTheme;
`;
    
    return themeCode;
  }
  
  /**
   * Generate mock data
   */
  generateMockData(dataModels: any[]): string {
    if (!dataModels || dataModels.length === 0) {
      return `
export const mockData = {
  users: [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ],
  products: [
    { id: 1, name: 'Product 1', price: 29.99, description: 'Description for product 1' },
    { id: 2, name: 'Product 2', price: 49.99, description: 'Description for product 2' },
    { id: 3, name: 'Product 3', price: 19.99, description: 'Description for product 3' },
  ],
};

export default mockData;
`;
    }
    
    let mockDataCode = `
export const mockData = {
`;
    
    dataModels.forEach((model, index) => {
      const modelName = model.name.toLowerCase() + 's';
      mockDataCode += `  ${modelName}: [\n`;
      
      // Generate 3 mock items for each model
      for (let i = 1; i <= 3; i++) {
        mockDataCode += `    {\n`;
        mockDataCode += `      id: ${i},\n`;
        
        model.fields.forEach(field => {
          const mockValue = this.generateMockValueForField(field, i);
          mockDataCode += `      ${field.name}: ${mockValue},\n`;
        });
        
        mockDataCode += `    },\n`;
      }
      
      mockDataCode += `  ],\n`;
    });
    
    mockDataCode += `};

export default mockData;
`;
    
    return mockDataCode;
  }
  
  /**
   * Generate mock value for a field based on its type
   */
  private generateMockValueForField(field: any, index: number): string {
    const fieldType = field.type.toLowerCase();
    
    if (fieldType.includes('string') || fieldType.includes('text')) {
      if (field.name.toLowerCase().includes('name')) {
        return `'${this.capitalizeFirstLetter(field.name)} ${index}'`;
      } else if (field.name.toLowerCase().includes('email')) {
        return `'user${index}@example.com'`;
      } else if (field.name.toLowerCase().includes('phone')) {
        return `'555-123-${index.toString().padStart(4, '0')}'`;
      } else if (field.name.toLowerCase().includes('description')) {
        return `'Description for ${field.name} ${index}'`;
      } else {
        return `'${this.capitalizeFirstLetter(field.name)} ${index}'`;
      }
    } else if (fieldType.includes('int') || fieldType.includes('number')) {
      if (field.name.toLowerCase().includes('price')) {
        return `${(19.99 + index * 10).toFixed(2)}`;
      } else if (field.name.toLowerCase().includes('quantity')) {
        return `${index * 5}`;
      } else if (field.name.toLowerCase().includes('age')) {
        return `${20 + index * 5}`;
      } else {
        return `${index}`;
      }
    } else if (fieldType.includes('bool')) {
      return index % 2 === 0 ? 'true' : 'false';
    } else if (fieldType.includes('date')) {
      return `'2023-${(index % 12) + 1}-${(index % 28) + 1}'`;
    } else if (fieldType.includes('array')) {
      return `[${index}, ${index + 1}, ${index + 2}]`;
    } else if (fieldType.includes('object')) {
      return `{ id: ${index}, name: 'Object ${index}' }`;
    } else {
      return `'${field.name} ${index}'`;
    }
  }
  
  /**
   * Generate API utilities
   */
  private generateApiUtils(apiEndpoints: any[]): string {
    if (!apiEndpoints || apiEndpoints.length === 0) {
      return `
import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Sample API methods
export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const postData = async (endpoint, data) => {
  try {
    const response = await api.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default api;
`;
    }
    
    let apiCode = `
import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API methods generated from endpoints
`;
    
    apiEndpoints.forEach(endpoint => {
      const methodName = this.generateMethodNameFromEndpoint(endpoint);
      const method = endpoint.method.toLowerCase();
      
      apiCode += `
export const ${methodName} = async (${this.generateMethodParams(endpoint)}) => {
  try {
    const response = await api.${method}(\`${this.formatEndpointPath(endpoint.path)}\`, ${method === 'get' ? 'params' : 'data'});
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
`;
    });
    
    apiCode += `
export default api;
`;
    
    return apiCode;
  }
  
  /**
   * Generate method name from endpoint
   */
  private generateMethodNameFromEndpoint(endpoint: any): string {
    const method = endpoint.method.toLowerCase();
    const path = endpoint.path.split('/').filter(Boolean);
    
    if (path.length === 0) {
      return `${method}Data`;
    }
    
    // Handle collection endpoints
    if (path.length === 1) {
      const resource = path[0];
      switch (method) {
        case 'get': return `fetch${this.capitalizeFirstLetter(resource)}`;
        case 'post': return `create${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}`;
        case 'put': return `update${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}`;
        case 'delete': return `delete${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}`;
        default: return `${method}${this.capitalizeFirstLetter(resource)}`;
      }
    }
    
    // Handle resource endpoints
    if (path.length >= 2) {
      const resource = path[0];
      const action = path[path.length - 1];
      
      // Check if path contains an ID parameter
      if (path.some(segment => segment.startsWith(':') || segment.includes('{}'))) {
        switch (method) {
          case 'get': return `fetch${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}ById`;
          case 'put': return `update${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}`;
          case 'delete': return `delete${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}`;
          default: return `${method}${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}`;
        }
      }
      
      // Handle action endpoints
      return `${method}${this.capitalizeFirstLetter(resource.replace(/s$/, ''))}${this.capitalizeFirstLetter(action)}`;
    }
    
    return `${method}Data`;
  }
  
  /**
   * Generate method parameters from endpoint
   */
  private generateMethodParams(endpoint: any): string {
    const method = endpoint.method.toLowerCase();
    const pathParams = (endpoint.path.match(/:[a-zA-Z]+/g) || [])
      .map(param => param.substring(1));
    
    if (method === 'get') {
      if (pathParams.length > 0) {
        return `${pathParams.join(', ')}, params = {}`;
      }
      return 'params = {}';
    } else {
      if (pathParams.length > 0) {
        return `${pathParams.join(', ')}, data = {}`;
      }
      return 'data = {}';
    }
  }
  
  /**
   * Format endpoint path for template string
   */
  private formatEndpointPath(path: string): string {
    // Replace :paramName with ${paramName}
    return path.replace(/:([a-zA-Z]+)/g, '${$1}');
  }
  
  /**
   * Generate authentication utilities
   */
  private generateAuthUtils(authentication: any): string {
    const authType = authentication?.type?.toLowerCase() || 'jwt';
    
    if (authType.includes('oauth')) {
      return `
import { authorize } from 'react-native-app-auth';
import api from './api';

// OAuth configuration
const config = {
  issuer: 'https://auth.example.com',
  clientId: 'YOUR_CLIENT_ID',
  redirectUrl: 'com.yourapp://callback',
  scopes: ['openid', 'profile', 'email'],
};

// Login with OAuth
export const login = async () => {
  try {
    const result = await authorize(config);
    await saveAuthResult(result);
    return result;
  } catch (error) {
    console.error('OAuth Error:', error);
    throw error;
  }
};

// Save authentication result
const saveAuthResult = async (result) => {
  try {
    localStorage.setItem('auth_token', result.accessToken);
    localStorage.setItem('refresh_token', result.refreshToken);
    localStorage.setItem('expires_at', result.accessTokenExpirationDate);
    
    // Update API headers
    api.defaults.headers.common.Authorization = \`Bearer \${result.accessToken}\`;
  } catch (error) {
    console.error('Error saving auth result:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const expiresAt = localStorage.getItem('expires_at');
  
  if (!expiresAt) {
    return false;
  }
  
  return new Date().getTime() < new Date(expiresAt).getTime();
};

// Logout
export const logout = async () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('expires_at');
    
    // Remove API headers
    delete api.defaults.headers.common.Authorization;
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/userinfo');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};
`;
    } else {
      return `
import api from './api';

// Login with email and password
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    await saveAuthResult(response.data);
    return response.data;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};

// Register new user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
};

// Save authentication result
const saveAuthResult = async (data) => {
  try {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_id', data.userId);
    
    // Update API headers
    api.defaults.headers.common.Authorization = \`Bearer \${data.token}\`;
  } catch (error) {
    console.error('Error saving auth result:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

// Logout
export const logout = async () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    
    // Remove API headers
    delete api.defaults.headers.common.Authorization;
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const userId = localStorage.getItem('user_id');
    const response = await api.get(\`/users/\${userId}\`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  } catch (error) {
    console.error('Password Reset Error:', error);
    throw error;
  }
};
`;
    }
  }
  
  /**
   * Generate App.js file
   */
  private generateAppJs(): string {
    return `
import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './themes/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <ThemeProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </ThemeProvider>
  );
};

export default App;
`;
  }
  
  /**
   * Generate index.js entry point
   */
  private generateIndexJs(): string {
    return `
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './package.json';

AppRegistry.registerComponent(appName, () => App);
`;
  }
  
  /**
   * Generate package.json
   */
  private generatePackageJson(appName: string): string {
    return `
{
  "name": "${appName.toLowerCase().replace(/\\s+/g, '-')}",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/stack": "^6.3.17",
    "axios": "^1.4.0",
    "react": "18.2.0",
    "react-native": "0.72.4",
    "react-native-app-auth": "^6.4.3",
    "react-native-gesture-handler": "^2.12.1",
    "react-native-reanimated": "^3.4.2",
    "react-native-safe-area-context": "^4.7.2",
    "react-native-screens": "^3.25.0",
    "react-native-vector-icons": "^10.0.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@babel/preset-env": "^7.20.0",
    "@babel/runtime": "^7.20.0",
    "@react-native/eslint-config": "^0.72.2",
    "babel-jest": "^29.2.1",
    "eslint": "^8.19.0",
    "jest": "^29.2.1",
    "metro-react-native-babel-preset": "0.76.8",
    "react-test-renderer": "18.2.0"
  },
  "jest": {
    "preset": "react-native"
  }
}
`;
  }
  
  /**
   * Generate preview HTML
   */
  private generatePreviewHtml(appSpec: any, uiDesignSystem: any): string {
    const title = appSpec.appName || 'Mobile App Preview';
    const description = appSpec.appDescription || 'Preview of a mobile application';
    const primaryColor = uiDesignSystem.designSystem?.colorPalette?.primary || '#007BFF';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Preview</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      height: 100vh;
      flex-direction: column;
      color: #333;
    }
    
    header {
      background-color: ${primaryColor};
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .description {
      font-size: 0.9rem;
      margin-top: 0.5rem;
      opacity: 0.9;
    }
    
    main {
      display: flex;
      flex: 1;
      padding: 2rem;
    }
    
    .preview-container {
      display: flex;
      flex: 1;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
    }
    
    .device {
      width: 375px;
      height: 812px;
      border-radius: 2rem;
      overflow: hidden;
      border: 12px solid #222;
      position: relative;
      box-shadow: 0 12px 24px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      background: white;
    }
    
    .device-header {
      height: 40px;
      background: #222;
      position: relative;
    }
    
    .device-header:after {
      content: '';
      position: absolute;
      width: 30%;
      height: 20px;
      background: #222;
      left: 35%;
      border-radius: 0 0 1rem 1rem;
    }
    
    .device-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .app-header {
      background-color: ${primaryColor};
      color: white;
      padding: 1rem;
      font-weight: bold;
    }
    
    .app-content {
      flex: 1;
      padding: 1rem;
    }
    
    .app-tab-bar {
      display: flex;
      border-top: 1px solid #eee;
      height: 60px;
    }
    
    .tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      font-size: 0.7rem;
      color: #666;
    }
    
    .tab.active {
      color: ${primaryColor};
    }
    
    .tab-icon {
      width: 24px;
      height: 24px;
      background-color: currentColor;
      mask-size: contain;
      mask-position: center;
      mask-repeat: no-repeat;
      margin-bottom: 4px;
    }
    
    .home-icon {
      mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>');
    }
    
    .profile-icon {
      mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>');
    }
    
    .notification-icon {
      mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>');
    }
    
    .settings-icon {
      mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>');
    }
    
    /* App Screen Components */
    .screen-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid #eee;
    }
    
    .card-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .button {
      background-color: ${primaryColor};
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-weight: bold;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .button.secondary {
      background-color: #f2f2f2;
      color: #333;
    }
    
    .input {
      border: 1px solid #ddd;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    
    .list-item {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
    }
    
    .list-item-content {
      flex: 1;
    }
    
    .list-item-title {
      font-weight: bold;
      margin-bottom: 0.25rem;
    }
    
    .list-item-description {
      font-size: 0.8rem;
      color: #666;
    }
    
    .dark-mode .device-content {
      background-color: #121212;
      color: white;
    }
    
    .dark-mode .card {
      background-color: #1e1e1e;
      border-color: #333;
    }
    
    .dark-mode .list-item {
      border-color: #333;
    }
    
    .dark-mode .list-item-description {
      color: #aaa;
    }
    
    .dark-mode .input {
      background-color: #333;
      border-color: #444;
      color: white;
    }
    
    .dark-mode .button.secondary {
      background-color: #333;
      color: white;
    }
    
    .mode-toggle {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #f2f2f2;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <div class="description">${description}</div>
  </header>
  
  <main>
    <div class="preview-container">
      <div class="device">
        <div class="device-header"></div>
        <div class="device-content">
          <div class="app-header">Home</div>
          <div class="app-content">
            <div class="screen-title">Welcome to ${appSpec.appName}</div>
            
            ${this.generatePreviewComponents(appSpec.screens)}
          </div>
          
          <div class="app-tab-bar">
            <div class="tab active">
              <div class="tab-icon home-icon"></div>
              <div>Home</div>
            </div>
            <div class="tab">
              <div class="tab-icon profile-icon"></div>
              <div>Profile</div>
            </div>
            <div class="tab">
              <div class="tab-icon notification-icon"></div>
              <div>Notifications</div>
            </div>
            <div class="tab">
              <div class="tab-icon settings-icon"></div>
              <div>Settings</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="device">
        <div class="device-header"></div>
        <div class="device-content dark-mode">
          <div class="app-header">Home</div>
          <div class="app-content">
            <div class="screen-title">Welcome to ${appSpec.appName}</div>
            
            ${this.generatePreviewComponents(appSpec.screens)}
          </div>
          
          <div class="app-tab-bar">
            <div class="tab active">
              <div class="tab-icon home-icon"></div>
              <div>Home</div>
            </div>
            <div class="tab">
              <div class="tab-icon profile-icon"></div>
              <div>Profile</div>
            </div>
            <div class="tab">
              <div class="tab-icon notification-icon"></div>
              <div>Notifications</div>
            </div>
            <div class="tab">
              <div class="tab-icon settings-icon"></div>
              <div>Settings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Simulate tab switching
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          // Remove active class from all tabs
          tabs.forEach(t => t.classList.remove('active'));
          // Add active class to clicked tab
          this.classList.add('active');
        });
      });
    });
  </script>
</body>
</html>
`;
  }
  
  /**
   * Generate preview components based on app screens
   */
  private generatePreviewComponents(screens: any[]): string {
    if (!screens || screens.length === 0) {
      return `
        <div class="card">
          <div class="card-title">Welcome</div>
          <div>No screens defined yet</div>
        </div>
        
        <div class="button">Get Started</div>
        
        <div class="card">
          <div class="card-title">Sample Card</div>
          <div>This is a sample card component</div>
        </div>
        
        <div class="input" placeholder="Sample input field"></div>
        
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">Sample Item 1</div>
            <div class="list-item-description">Description for sample item 1</div>
          </div>
        </div>
        
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">Sample Item 2</div>
            <div class="list-item-description">Description for sample item 2</div>
          </div>
        </div>
      `;
    }
    
    // Use the first screen for preview
    const mainScreen = screens[0];
    
    let components = '';
    
    if (mainScreen.components) {
      mainScreen.components.forEach(component => {
        switch (component.type) {
          case 'button':
            components += `
              <div class="button${component.properties?.variant === 'secondary' ? ' secondary' : ''}">${component.properties?.title || 'Button'}</div>
            `;
            break;
          case 'textfield':
            components += `
              <div class="input" placeholder="${component.properties?.placeholder || 'Enter text...'}"></div>
            `;
            break;
          case 'card':
            components += `
              <div class="card">
                <div class="card-title">${component.properties?.title || 'Card Title'}</div>
                <div>${component.properties?.content || 'Card content goes here'}</div>
              </div>
            `;
            break;
          case 'list':
            components += `
              <div class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">Sample Item 1</div>
                  <div class="list-item-description">Description for sample item 1</div>
                </div>
              </div>
              
              <div class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">Sample Item 2</div>
                  <div class="list-item-description">Description for sample item 2</div>
                </div>
              </div>
              
              <div class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">Sample Item 3</div>
                  <div class="list-item-description">Description for sample item 3</div>
                </div>
              </div>
            `;
            break;
          default:
            components += `
              <div class="card">
                <div class="card-title">Component: ${component.type}</div>
                <div>This is a sample ${component.type} component</div>
              </div>
            `;
        }
      });
    } else {
      // Default components if none defined
      components = `
        <div class="card">
          <div class="card-title">Welcome</div>
          <div>This is a preview of your app</div>
        </div>
        
        <div class="button">Get Started</div>
        
        <div class="input" placeholder="Username"></div>
        <div class="input" placeholder="Password"></div>
        
        <div class="button secondary">Learn More</div>
        
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">Sample Item 1</div>
            <div class="list-item-description">Description for sample item 1</div>
          </div>
        </div>
        
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">Sample Item 2</div>
            <div class="list-item-description">Description for sample item 2</div>
          </div>
        </div>
      `;
    }
    
    return components;
  }
  
  // Utility methods
  
  /**
   * Generate button component
   */
  private generateButtonComponent(props: any, theme: any): string {
    return `
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

const Button = ({ title, onPress, type = 'primary', style, disabled }) => {
  const { theme } = useTheme();
  
  // Button styles based on type
  const getBackgroundColor = () => {
    if (disabled) {
      return theme.colors.text.hint;
    }
    
    switch (type) {
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
        return 'transparent';
      case 'text':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) {
      return theme.colors.background;
    }
    
    switch (type) {
      case 'outline':
      case 'text':
        return theme.colors.primary;
      default:
        return 'white';
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'outline':
        return theme.colors.primary;
      default:
        return 'transparent';
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: type === 'outline' ? 1 : 0,
          borderRadius: theme.borderRadius.medium,
          padding: type === 'text' ? 8 : 12,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: theme.typography.fontSize.button,
            fontWeight: theme.typography.fontWeight.medium,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;
`;
  }
  
  /**
   * Generate input component
   */
  private generateInputComponent(props: any, theme: any): string {
    return `
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  disabled,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  // Input styles based on state
  const getBorderColor = () => {
    if (error) {
      return theme.colors.error;
    }
    if (isFocused) {
      return theme.colors.primary;
    }
    return theme.colors.text.hint;
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.error : theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.caption,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: disabled ? theme.colors.surface : theme.colors.background,
            borderColor: getBorderColor(),
            borderRadius: theme.borderRadius.medium,
            padding: theme.spacing.md,
            fontSize: theme.typography.fontSize.body,
            color: theme.colors.text.primary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.hint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={!disabled}
      />
      
      {error && (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.error,
              fontSize: theme.typography.fontSize.caption,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    width: '100%',
    borderWidth: 1,
  },
  error: {
    marginTop: 4,
  },
});

export default Input;
`;
  }
  
  /**
   * Generate card component
   */
  private generateCardComponent(props: any, theme: any): string {
    return `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

const Card = ({ title, content, children, style }) => {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.medium,
          padding: theme.spacing.lg,
          ...this.getShadowStyle(theme.shadows.small),
        },
        style,
      ]}
    >
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.h2,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {title}
        </Text>
      )}
      
      {content && (
        <Text
          style={[
            styles.content,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.body,
            },
          ]}
        >
          {content}
        </Text>
      )}
      
      {children}
    </View>
  );
};

// Helper to convert shadow string to React Native shadow properties
Card.prototype.getShadowStyle = (shadowString) => {
  // Parse shadow values (assumes format like "0 1px 3px rgba(0,0,0,0.12)")
  const parts = shadowString.match(/([0-9.]+px) ([0-9.]+px) ([0-9.]+px) (rgba?\\([^)]+\\))/);
  
  if (!parts) {
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    };
  }
  
  return {
    shadowColor: parts[4],
    shadowOffset: {
      width: parseInt(parts[1]),
      height: parseInt(parts[2]),
    },
    shadowOpacity: 0.2,
    shadowRadius: parseInt(parts[3]),
    elevation: parseInt(parts[3]) + 2,
  };
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  content: {
  },
});

export default Card;
`;
  }
  
  /**
   * Generate list component
   */
  private generateListComponent(props: any, theme: any): string {
    return `
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

const ListItem = ({ title, description, onPress, leadingIcon, trailingIcon, style }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.text.hint + '20',
          borderBottomWidth: 1,
          padding: theme.spacing.md,
        },
        style,
      ]}
      onPress={onPress}
    >
      {leadingIcon && (
        <View style={styles.leadingIcon}>
          {leadingIcon}
        </View>
      )}
      
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text.primary,
              fontSize: theme.typography.fontSize.body,
              fontWeight: theme.typography.fontWeight.medium,
            },
          ]}
        >
          {title}
        </Text>
        
        {description && (
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.caption,
              },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
      
      {trailingIcon && (
        <View style={styles.trailingIcon}>
          {trailingIcon}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leadingIcon: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  description: {
  },
  trailingIcon: {
    marginLeft: 16,
  },
});

export default ListItem;
`;
  }
  
  /**
   * Generate navigation component
   */
  private generateNavigationComponent(props: any, theme: any): string {
    return `
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

// Tab bar component
export const TabBar = ({ tabs, activeIndex, onTabPress, style }) => {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.text.hint + '20',
          borderTopWidth: 1,
          height: 60,
        },
        style,
      ]}
    >
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tab}
          onPress={() => onTabPress(index)}
        >
          {tab.icon && (
            <View
              style={[
                styles.tabIcon,
                {
                  tintColor: index === activeIndex ? theme.colors.primary : theme.colors.text.secondary,
                },
              ]}
            >
              {tab.icon}
            </View>
          )}
          
          <Text
            style={[
              styles.tabLabel,
              {
                color: index === activeIndex ? theme.colors.primary : theme.colors.text.secondary,
                fontSize: theme.typography.fontSize.caption,
                fontWeight: index === activeIndex ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
              },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Header component
export const Header = ({ title, leftAction, rightAction, style }) => {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.primary,
          height: 56,
          paddingHorizontal: theme.spacing.md,
        },
        style,
      ]}
    >
      {leftAction && (
        <TouchableOpacity style={styles.headerAction} onPress={leftAction.onPress}>
          {leftAction.icon}
        </TouchableOpacity>
      )}
      
      <Text
        style={[
          styles.headerTitle,
          {
            color: 'white',
            fontSize: theme.typography.fontSize.h2,
            fontWeight: theme.typography.fontWeight.medium,
          },
        ]}
      >
        {title}
      </Text>
      
      {rightAction && (
        <TouchableOpacity style={styles.headerAction} onPress={rightAction.onPress}>
          {rightAction.icon}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Drawer item component
export const DrawerItem = ({ label, icon, isActive, onPress, style }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.drawerItem,
        {
          backgroundColor: isActive ? theme.colors.primary + '20' : 'transparent',
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        },
        style,
      ]}
      onPress={onPress}
    >
      {icon && (
        <View
          style={[
            styles.drawerItemIcon,
            {
              tintColor: isActive ? theme.colors.primary : theme.colors.text.secondary,
              marginRight: theme.spacing.md,
            },
          ]}
        >
          {icon}
        </View>
      )}
      
      <Text
        style={[
          styles.drawerItemLabel,
          {
            color: isActive ? theme.colors.primary : theme.colors.text.primary,
            fontSize: theme.typography.fontSize.body,
            fontWeight: isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Tab Bar styles
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    textAlign: 'center',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    padding: 8,
  },
  
  // Drawer styles
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  drawerItemIcon: {
    marginRight: 16,
  },
  drawerItemLabel: {
    flex: 1,
  },
});

export default { TabBar, Header, DrawerItem };
`;
  }
  
  /**
   * Generate dialog component
   */
  private generateDialogComponent(props: any, theme: any): string {
    return `
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

const Dialog = ({
  visible,
  title,
  content,
  actions,
  onDismiss,
  style,
}) => {
  const { theme } = useTheme();
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.dialogContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.medium,
                  padding: theme.spacing.lg,
                  ...this.getShadowStyle(theme.shadows.large),
                },
                style,
              ]}
            >
              {title && (
                <Text
                  style={[
                    styles.title,
                    {
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.fontSize.h2,
                      fontWeight: theme.typography.fontWeight.bold,
                      marginBottom: theme.spacing.md,
                    },
                  ]}
                >
                  {title}
                </Text>
              )}
              
              {content && (
                <Text
                  style={[
                    styles.content,
                    {
                      color: theme.colors.text.secondary,
                      fontSize: theme.typography.fontSize.body,
                      marginBottom: theme.spacing.lg,
                    },
                  ]}
                >
                  {content}
                </Text>
              )}
              
              {actions && actions.length > 0 && (
                <View
                  style={[
                    styles.actions,
                    {
                      marginTop: theme.spacing.md,
                    },
                  ]}
                >
                  {actions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.actionButton,
                        {
                          marginLeft: index > 0 ? theme.spacing.md : 0,
                          padding: theme.spacing.sm,
                        },
                      ]}
                      onPress={action.onPress}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          {
                            color: action.isDefault ? theme.colors.primary : theme.colors.text.secondary,
                            fontSize: theme.typography.fontSize.body,
                            fontWeight: action.isDefault ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
                          },
                        ]}
                      >
                        {action.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Helper to convert shadow string to React Native shadow properties
Dialog.prototype.getShadowStyle = (shadowString) => {
  // Parse shadow values (assumes format like "0 10px 20px rgba(0,0,0,0.15)")
  const parts = shadowString.match(/([0-9.]+px) ([0-9.]+px) ([0-9.]+px) (rgba?\\([^)]+\\))/);
  
  if (!parts) {
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10,
    };
  }
  
  return {
    shadowColor: parts[4],
    shadowOffset: {
      width: parseInt(parts[1]),
      height: parseInt(parts[2]),
    },
    shadowOpacity: 0.5,
    shadowRadius: parseInt(parts[3]),
    elevation: parseInt(parts[3]),
  };
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContainer: {
    width: '80%',
    maxWidth: 400,
  },
  title: {
    marginBottom: 8,
  },
  content: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    textAlign: 'center',
  },
});

export default Dialog;
`;
  }
  
  /**
   * Generate generic component
   */
  private generateGenericComponent(componentType: string, props: any, theme: any): string {
    return `
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

const ${this.capitalizeFirstLetter(componentType)} = ({ style, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.medium,
          padding: theme.spacing.md,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.body,
          },
        ]}
      >
        ${this.capitalizeFirstLetter(componentType)} Component
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  text: {
    textAlign: 'center',
  },
});

export default ${this.capitalizeFirstLetter(componentType)};
`;
  }
  
  /**
   * Map component type to import name
   */
  private mapComponentTypeToImport(componentType: string): string {
    switch (componentType) {
      case 'button':
        return 'Button';
      case 'textfield':
        return 'Input';
      case 'card':
        return 'Card';
      case 'list':
        return 'ListItem';
      default:
        return this.capitalizeFirstLetter(componentType);
    }
  }
  
  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}