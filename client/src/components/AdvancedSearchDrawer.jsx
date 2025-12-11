import React, { useState } from 'react'
import { Drawer, Form, Input, DatePicker, Select, Button, Space, message } from 'antd'
import { SearchOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons'

const { RangePicker } = DatePicker
const { Option } = Select

function AdvancedSearchDrawer({ visible, onClose, onApply, fields = [], presets = [] }) {
  const [form] = Form.useForm()
  const [selectedPreset, setSelectedPreset] = useState(null)

  const handleApply = () => {
    const values = form.getFieldsValue()
    
    // Filter out empty values
    const filters = {}
    Object.keys(values).forEach(key => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        if (key === 'dateRange' && values[key]) {
          filters.dateRange = [values[key][0].toDate(), values[key][1].toDate()]
        } else {
          filters[key] = values[key]
        }
      }
    })

    onApply(filters)
    onClose()
  }

  const handleClear = () => {
    form.resetFields()
    setSelectedPreset(null)
    onApply({})
    onClose()
  }

  const handleSavePreset = () => {
    const values = form.getFieldsValue()
    const presetName = prompt('Enter preset name:')
    
    if (presetName) {
      const existingPresets = JSON.parse(localStorage.getItem('searchPresets') || '[]')
      existingPresets.push({ name: presetName, filters: values })
      localStorage.setItem('searchPresets', JSON.stringify(existingPresets))
      message.success('Preset saved successfully')
    }
  }

  const handleLoadPreset = (presetName) => {
    const existingPresets = JSON.parse(localStorage.getItem('searchPresets') || '[]')
    const preset = existingPresets.find(p => p.name === presetName)
    
    if (preset) {
      form.setFieldsValue(preset.filters)
      setSelectedPreset(presetName)
    }
  }

  const savedPresets = JSON.parse(localStorage.getItem('searchPresets') || '[]')

  return (
    <Drawer
      title="Advanced Search & Filters"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={handleClear} icon={<ClearOutlined />}>
            Clear All
          </Button>
          <Button onClick={handleSavePreset} icon={<SaveOutlined />}>
            Save Preset
          </Button>
          <Button type="primary" onClick={handleApply} icon={<SearchOutlined />}>
            Apply Filters
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {savedPresets.length > 0 && (
          <Form.Item label="Load Preset">
            <Select
              placeholder="Select a saved preset"
              value={selectedPreset}
              onChange={handleLoadPreset}
              allowClear
            >
              {savedPresets.map(preset => (
                <Option key={preset.name} value={preset.name}>
                  {preset.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item label="Date Range" name="dateRange">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {fields.map(field => {
          if (field.type === 'input') {
            return (
              <Form.Item key={field.name} label={field.label} name={field.name}>
                <Input placeholder={field.placeholder} />
              </Form.Item>
            )
          }

          if (field.type === 'select') {
            return (
              <Form.Item key={field.name} label={field.label} name={field.name}>
                <Select placeholder={field.placeholder} allowClear>
                  {field.options?.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )
          }

          if (field.type === 'number') {
            return (
              <Form.Item key={field.name} label={field.label} name={field.name}>
                <Input type="number" placeholder={field.placeholder} />
              </Form.Item>
            )
          }

          return null
        })}
      </Form>
    </Drawer>
  )
}

export default AdvancedSearchDrawer
