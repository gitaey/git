package sis.com.db;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.*;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

//import tgis.user.auth.interceptor.AuthInterceptor;

public class HotDeployableMybatisSessionFactoryBean extends SqlSessionFactoryBean implements DisposableBean {

	private static final Logger LOGGER = LoggerFactory.getLogger(HotDeployableMybatisSessionFactoryBean.class);

	private SqlSessionFactory proxy;
	private int interval = 500;
	private boolean running = false;

	private Timer timer;
	private TimerTask task;

	private final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();
	private final Lock r = rwl.readLock();
	private final Lock w = rwl.writeLock();

	public Resource[] mapperLocations;

	@Override
	public void setMapperLocations(Resource[] mapperLocations) {
		super.setMapperLocations(mapperLocations);
		this.mapperLocations = mapperLocations;
	}

	public void setInterval(int interval) {
		this.interval = interval;
	}

	public void refresh() throws Exception {
		w.lock();

		try {
			super.afterPropertiesSet();

		} finally {
			w.unlock();
		}

		LOGGER.debug("Mybatis Mapper File Reloaded!");
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		super.afterPropertiesSet();

		setRefreshable();
	}

	private void setRefreshable() {
		proxy = (SqlSessionFactory) Proxy.newProxyInstance(
				SqlSessionFactory.class.getClassLoader(),
				new Class[]{SqlSessionFactory.class},
				new InvocationHandler() {
					@Override
					public Object invoke(Object proxy, Method method,
										 Object[] args) throws Throwable {
						// log.debug("method.getName() : " + method.getName());
						return method.invoke(getParentObject(), args);
					}
				});

		task = new TimerTask() {
			private final Map<Resource, Long> map = new HashMap<Resource, Long>();

			@Override
			public void run() {
				if (isModified()) {
					try {
						refresh();
					} catch (Exception e) {
						if (LOGGER.isDebugEnabled()) {
							LOGGER.error("Refresh Error Exception", e);
						} else {
							LOGGER.error("Refresh Error Exception");
						}
					}
				}
			}

			private boolean isModified() {
				boolean retVal = false;

				if (mapperLocations != null) {
					for (int i = 0; i < mapperLocations.length; i++) {
						Resource mappingLocation = mapperLocations[i];
						retVal |= findModifiedResource(mappingLocation);
					}
				}

				return retVal;
			}

			private boolean findModifiedResource(Resource resource) {
				boolean retVal = false;
				List<String> modifiedResources = new ArrayList<String>();

				try {
					long modified = resource.lastModified();

					if (map.containsKey(resource)) {
						long lastModified = map.get(resource).longValue();

						if (lastModified != modified) {
							map.put(resource, new Long(modified));
							modifiedResources.add(resource.getDescription());
							retVal = true;
						}
					} else {
						map.put(resource, new Long(modified));
					}
				} catch (IOException e) {
					LOGGER.debug("Exception: " + e.toString());
					//LOGGER.error("File Find Exception", e);
				}

				if (retVal) {
					LOGGER.debug("Mybatis Mapper File Changed: " + modifiedResources);
				}
				return retVal;
			}
		};

		timer = new Timer(true);
		resetInterval();

	}

	private Object getParentObject() throws Exception {
		r.lock();
		try {
			return super.getObject();
		} finally {
			r.unlock();
		}
	}

	@Override
	public SqlSessionFactory getObject() {
		return this.proxy;
	}

	@Override
	public Class<? extends SqlSessionFactory> getObjectType() {
		return (this.proxy != null ? this.proxy.getClass() : SqlSessionFactory.class);
	}

	@Override
	public boolean isSingleton() {
		return true;
	}

	public void setCheckInterval(int ms) {
		interval = ms;

		if (timer != null) {
			resetInterval();
		}
	}

	private void resetInterval() {
		if (running) {
			timer.cancel();
			running = false;
		}
		if (interval > 0) {
			timer.schedule(task, 0, interval);
			running = true;
		}
	}

	@Override
	public void destroy() {
		timer.cancel();
	}

}