import java.lang.management.ManagementFactory;
import java.lang.management.MemoryPoolMXBean;
import java.lang.management.MemoryType;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * 用于测试 jmap, jinfo, jstat, jstack 等 JVM 诊断工具的测试程序
 */
public class JvmTest {
    
    // 用于内存测试的列表
    private static final List<byte[]> memoryLeak = new java.util.ArrayList<>();
    
    // 用于线程测试的锁
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();
    
    public static void main(String[] args) throws InterruptedException {
        System.out.println("JVM 诊断工具测试程序启动...");
        // Java 8 兼容方式获取 PID
        String pid = java.lang.management.ManagementFactory.getRuntimeMXBean().getName().split("@")[0];
        System.out.println("PID: " + pid);
        System.out.println("JVM 参数：" + ManagementFactory.getRuntimeMXBean().getInputArguments());
        
        // 打印内存池信息
        printMemoryPools();

        // 注册优雅关闭
        registerShutdownHook();

        // 启动测试线程
        startTestThreads();
        
        // 创建内存压力
        createMemoryPressure();
        
        // 创建死锁场景
        createDeadlock();
        
        System.out.println("\n测试程序已就绪，可以使用以下命令进行诊断:");
        System.out.println("  jps -l          - 查看 Java 进程");
        System.out.println("  jinfo -flag +UseG1GC <pid>   - 查看/修改 JVM 参数");
        System.out.println("  jstat -gc <pid> 1000          - 查看 GC 统计");
        System.out.println("  jstack <pid>    - 查看线程堆栈");
        System.out.println("  jmap -heap <pid> - java8查看堆内存");
        System.out.println("  jhsdb jmap --heap --pid <pid> - java8以上查看堆内存");
        System.out.println("  jmap -histo:live <pid> | head - 查看对象直方图");
        System.out.println("  jmap -dump:format=b,file=heap.hprof <pid> - 导出堆快照");
        
        // 保持程序运行
        while (true) {
            TimeUnit.SECONDS.sleep(10);
        }
    }

    private static void registerShutdownHook() {
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n=== 最终统计 ===");
            System.out.println("已分配内存块数: " + memoryLeak.size() + " (" + memoryLeak.size() + "MB)");
        }, "Shutdown-Hook"));
    }

    private static void printMemoryPools() {
        System.out.println("\n=== 内存池信息 ===");
        List<MemoryPoolMXBean> memoryPoolMXBeans = ManagementFactory.getMemoryPoolMXBeans();
        for (MemoryPoolMXBean pool : memoryPoolMXBeans) {
            if (pool.getType() == MemoryType.HEAP) {
                System.out.println("堆内存池：" + pool.getName());
                // Java 8 兼容方式
                System.out.println("  初始大小：" + pool.getUsage().getInit());
                System.out.println("  已使用：" + pool.getUsage().getUsed());
                System.out.println("  已提交：" + pool.getUsage().getCommitted());
                System.out.println("  最大值：" + pool.getUsage().getMax());
            }
        }
    }
    
    private static void startTestThreads() {
        System.out.println("\n=== 启动测试线程 ===");

        // 线程 1: 模拟 CPU 计算
        Thread cpuWorker = new Thread(() -> {
            while (true) {
                double result = 0;
                for (int i = 0; i < 10000; i++) {
                    result += Math.sqrt(i) * Math.sin(i);
                }
                try {
                    TimeUnit.MILLISECONDS.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }, "CPU-Worker-Thread");
        cpuWorker.setDaemon(true);
        cpuWorker.start();

        // 线程 2: 等待通知 (WAITING 状态)
        Thread waitThread = new Thread(() -> {
            System.out.println("等待通知线程启动");
            synchronized (lock1) {
                try {
                    lock1.wait();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "Wait-Thread");
        waitThread.setDaemon(true);
        waitThread.start();
    }
    
    private static void createMemoryPressure() {
        System.out.println("\n=== 创建内存压力 ===");

        Thread memoryThread = new Thread(() -> {
            int count = 0;
            while (true) {
                try {
                    byte[] block = new byte[1024 * 1024];
                    memoryLeak.add(block);
                    count++;

                    if (count % 50 == 0) {
                        System.out.println("已分配 " + count + " 个 1MB 块 (总计：" + count + "MB)");
                    }

                    TimeUnit.MILLISECONDS.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }, "Memory-Leak-Thread");
        memoryThread.setDaemon(true);
        memoryThread.start();
    }
    
    private static void createDeadlock() {
        System.out.println("\n=== 创建死锁场景 ===");

        CountDownLatch latch = new CountDownLatch(2);

        Thread deadlockThread1 = new Thread(() -> {
            synchronized (lock1) {
                System.out.println("死锁线程 1 获取 lock1，等待 lock2...");
                latch.countDown();
                try {
                    latch.await();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println("死锁线程 1 尝试获取 lock2...");
                synchronized (lock2) {
                    System.out.println("死锁线程 1 获取 lock2");
                }
            }
        }, "Deadlock-Thread-1");

        Thread deadlockThread2 = new Thread(() -> {
            synchronized (lock2) {
                System.out.println("死锁线程 2 获取 lock2，等待 lock1...");
                latch.countDown();
                try {
                    latch.await();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println("死锁线程 2 尝试获取 lock1...");
                synchronized (lock1) {
                    System.out.println("死锁线程 2 获取 lock1");
                }
            }
        }, "Deadlock-Thread-2");

        deadlockThread1.start();
        deadlockThread2.start();
    }
}
