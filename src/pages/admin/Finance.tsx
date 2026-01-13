import { useState } from "react";
import { 
  Plus, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUpDown,
  FileText,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

interface Transaction {
  id: number;
  date: string;
  description: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  project?: string;
  status: "completed" | "pending";
}

const transactions: Transaction[] = [
  { id: 1, date: "2024-12-12", description: "Thanh toán dự án Bình Dương - Đợt 1", type: "income", category: "Dự án", amount: 450000000, project: "BD-01", status: "completed" },
  { id: 2, date: "2024-12-11", description: "Mua linh kiện Gateway G4", type: "expense", category: "Nguyên vật liệu", amount: 85000000, status: "completed" },
  { id: 3, date: "2024-12-10", description: "Lương tháng 12/2024", type: "expense", category: "Nhân sự", amount: 320000000, status: "pending" },
  { id: 4, date: "2024-12-09", description: "Thanh toán dự án Đà Nẵng - Đợt 2", type: "income", category: "Dự án", amount: 280000000, project: "DN-03", status: "completed" },
  { id: 5, date: "2024-12-08", description: "Chi phí vận chuyển", type: "expense", category: "Vận hành", amount: 12500000, status: "completed" },
  { id: 6, date: "2024-12-07", description: "Bảo trì thiết bị", type: "expense", category: "Bảo trì", amount: 8500000, status: "completed" },
  { id: 7, date: "2024-12-06", description: "Hợp đồng tư vấn kỹ thuật", type: "income", category: "Dịch vụ", amount: 65000000, status: "completed" },
  { id: 8, date: "2024-12-05", description: "Thuê văn phòng tháng 12", type: "expense", category: "Vận hành", amount: 45000000, status: "completed" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
};

const Finance = () => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("month");

  const filteredTransactions = transactions.filter(t => 
    typeFilter === "all" || t.type === typeFilter
  );

  const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const profit = totalIncome - totalExpense;

  const handleExport = (format: string) => {
    toast.success(`Đang xuất báo cáo ${format}...`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Quản lý thu chi</h1>
          <p className="text-muted-foreground">Theo dõi doanh thu, chi phí và lợi nhuận</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("Excel")}>
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("PDF")}>
            <FileText className="w-4 h-4" />
            Xuất PDF
          </Button>
          <Button>
            <Plus className="w-4 h-4" />
            Thêm giao dịch
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <span className="text-sm text-success flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +15%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalIncome)}</div>
            <div className="text-sm text-muted-foreground">Tổng doanh thu</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <span className="text-sm text-destructive flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalExpense)}</div>
            <div className="text-sm text-muted-foreground">Tổng chi phí</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm text-success flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +22%
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(profit)}</div>
            <div className="text-sm text-muted-foreground">Lợi nhuận</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-info">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-info" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{transactions.length}</div>
            <div className="text-sm text-muted-foreground">Giao dịch tháng này</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Kỳ báo cáo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Tuần này</SelectItem>
            <SelectItem value="month">Tháng này</SelectItem>
            <SelectItem value="quarter">Quý này</SelectItem>
            <SelectItem value="year">Năm nay</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="income">Thu</SelectItem>
            <SelectItem value="expense">Chi</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="sm:ml-auto">
          <Filter className="w-4 h-4" />
          Lọc nâng cao
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Ngày
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Mô tả</th>
                <th>Phân loại</th>
                <th>Dự án</th>
                <th>Loại</th>
                <th className="text-right">
                  <button className="flex items-center gap-1 hover:text-foreground ml-auto">
                    Số tiền
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className="font-medium text-foreground">{transaction.description}</div>
                  </td>
                  <td>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="text-muted-foreground">
                    {transaction.project || "-"}
                  </td>
                  <td>
                    <span className={`status-badge ${transaction.type === "income" ? "success" : "error"}`}>
                      {transaction.type === "income" ? "Thu" : "Chi"}
                    </span>
                  </td>
                  <td className={`text-right font-medium ${
                    transaction.type === "income" ? "text-success" : "text-destructive"
                  }`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td>
                    <span className={`status-badge ${transaction.status === "completed" ? "success" : "warning"}`}>
                      {transaction.status === "completed" ? "Hoàn thành" : "Chờ xử lý"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="grid sm:grid-cols-3 gap-4 p-4 border-t border-border bg-muted/30">
          <div>
            <div className="text-sm text-muted-foreground">Tổng thu</div>
            <div className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Tổng chi</div>
            <div className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Chênh lệch</div>
            <div className={`text-lg font-bold ${profit >= 0 ? "text-success" : "text-destructive"}`}>
              {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
