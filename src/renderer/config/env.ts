export const ENV = (() => {
  // Use Vite's built-in production flag - no .env files required
  // import.meta.env.PROD is true when building with vite build (production mode)
  const isRelease = import.meta.env.PROD
  const mode = import.meta.env.MODE || (isRelease ? 'production' : 'development')
  
  // Test features are only enabled in development builds
  const enableTestFeatures = !isRelease

  return {
    mode,
    isRelease,
    enableTestFeatures,
  }
})()
